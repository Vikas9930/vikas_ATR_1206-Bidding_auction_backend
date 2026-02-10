import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuctionItem, AuctionStatus } from '../auctions/entities/auction-item.entity';
import { AuctionWin } from '../auctions/entities/auction-win.entity';
import { User } from '../users/entities/user.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Processor('auction-settlement')
@Injectable()
export class AuctionSettlementProcessor extends WorkerHost {
  private readonly logger = new Logger(AuctionSettlementProcessor.name);

  constructor(
    @InjectRepository(AuctionItem)
    private auctionRepository: Repository<AuctionItem>,
    @InjectRepository(AuctionWin)
    private auctionWinRepository: Repository<AuctionWin>,
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
        // Check if win record already exists (idempotency check)
        const existingWin = await queryRunner.manager.findOne(AuctionWin, {
          where: { auctionId },
        });

        if (existingWin) {
          this.logger.log(`Win record already exists for auction ${auctionId}, skipping`);
          await queryRunner.rollbackTransaction();
          return;
        }

        // Auction sold
        auction.status = AuctionStatus.SOLD;
        auction.winnerId = highestBid.bidderId;
        await queryRunner.manager.save(auction);

        // Transfer funds: winner's escrow goes to creator
        // The winner's balance was already deducted when they bid
        // Now we transfer that amount to the creator
        const creator = await queryRunner.manager.findOne(User, {
          where: { id: auction.creatorId },
          lock: { mode: 'pessimistic_write' },
        });
        if (creator) {
          creator.balance = Number(creator.balance) + Number(highestBid.amount);
          await queryRunner.manager.save(creator);
        }

        // Get winner with lock
        const winner = await queryRunner.manager.findOne(User, {
          where: { id: highestBid.bidderId },
          lock: { mode: 'pessimistic_write' },
        });

        if (winner) {
          // Increment winner's total wins (idempotent - using database increment)
          await queryRunner.manager.increment(User, { id: highestBid.bidderId }, 'totalWins', 1);
        }

        // Create auction win history record
        const auctionWin = queryRunner.manager.create(AuctionWin, {
          auctionId,
          winnerId: highestBid.bidderId,
          finalPrice: Number(highestBid.amount),
          endedAt: now,
        });
        await queryRunner.manager.save(auctionWin);

        await queryRunner.commitTransaction();

        // Emit WebSocket events
        const winnerName = highestBid.bidder?.email?.split('@')[0] || 'Unknown';
        const winnerId = highestBid.bidderId;
        
        // Emit to auction room (all viewers)
        this.websocketGateway.emitAuctionSold(
          auctionId,
          winnerId,
          winnerName,
          Number(highestBid.amount),
        );

        // Emit specific notification to winner
        this.websocketGateway.emitAuctionWon(
          winnerId,
          {
            auctionId,
            auctionTitle: auction.title,
            finalPrice: Number(highestBid.amount),
            winnerName,
          },
        );

        // Emit balance update to creator (they received payment)
        const creatorUpdated = await this.auctionRepository.manager.findOne(User, {
          where: { id: auction.creatorId },
        });
        if (creatorUpdated) {
          this.websocketGateway.emitBalanceUpdate(
            auction.creatorId,
            Number(creatorUpdated.balance),
          );
        }

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

