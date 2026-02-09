import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuctionItem, AuctionStatus } from '../auctions/entities/auction-item.entity';
import { User } from '../users/entities/user.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Processor('auction-settlement')
@Injectable()
export class AuctionSettlementProcessor extends WorkerHost {
  private readonly logger = new Logger(AuctionSettlementProcessor.name);

  constructor(
    @InjectRepository(AuctionItem)
    private auctionRepository: Repository<AuctionItem>,
    private dataSource: DataSource,
    private websocketGateway: WebsocketGateway,
  ) {
    super();
  }

  async process(job: Job<{ auctionId: string }>) {
    const { auctionId } = job.data;
    this.logger.log(`Processing settlement for auction ${auctionId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Use pessimistic lock to prevent double settlement
      const auction = await queryRunner.manager.findOne(AuctionItem, {
        where: { id: auctionId },
        lock: { mode: 'pessimistic_write' },
        relations: ['creator', 'bids', 'bids.bidder'],
      });

      if (!auction) {
        this.logger.warn(`Auction ${auctionId} not found`);
        return;
      }

      // Idempotency check: if already settled, skip
      if (auction.status !== AuctionStatus.ACTIVE) {
        this.logger.log(`Auction ${auctionId} already settled (status: ${auction.status})`);
        await queryRunner.rollbackTransaction();
        return;
      }

      // Check if auction has ended
      const now = new Date();
      if (auction.endsAt > now) {
        this.logger.log(`Auction ${auctionId} has not ended yet`);
        await queryRunner.rollbackTransaction();
        return;
      }

      // Find highest bid
      const highestBid = auction.bids?.length
        ? auction.bids.reduce((prev, current) =>
            Number(current.amount) > Number(prev.amount) ? current : prev,
          )
        : null;

      if (highestBid) {
        // Auction sold
        auction.status = AuctionStatus.SOLD;
        auction.winnerId = highestBid.bidderId;
        await queryRunner.manager.save(auction);

        // Transfer funds: winner's escrow goes to creator
        // The winner's balance was already deducted when they bid
        // Now we transfer that amount to the creator
        const creator = await queryRunner.manager.findOne(User, {
          where: { id: auction.creatorId },
        });
        if (creator) {
          creator.balance = Number(creator.balance) + Number(highestBid.amount);
          await queryRunner.manager.save(creator);
        }

        await queryRunner.commitTransaction();

        // Emit WebSocket event
        const winnerName = highestBid.bidder?.email?.split('@')[0] || 'Unknown';
        this.websocketGateway.emitAuctionSold(
          auctionId,
          winnerName,
          Number(highestBid.amount),
        );

        this.logger.log(`Auction ${auctionId} sold to ${winnerName} for $${highestBid.amount}`);
      } else {
        // Auction expired (no bids)
        auction.status = AuctionStatus.EXPIRED;
        await queryRunner.manager.save(auction);
        await queryRunner.commitTransaction();

        // Emit WebSocket event
        this.websocketGateway.emitAuctionExpired(auctionId);

        this.logger.log(`Auction ${auctionId} expired with no bids`);
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error settling auction ${auctionId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed:`, error);
  }
}

