import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, LessThan } from 'typeorm';
import { AuctionItem, AuctionStatus } from './entities/auction-item.entity';
import { Bid } from './entities/bid.entity';
import { User } from '../users/entities/user.entity';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class AuctionsService {
  constructor(
    @InjectRepository(AuctionItem)
    private auctionRepository: Repository<AuctionItem>,
    @InjectRepository(Bid)
    private bidRepository: Repository<Bid>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private websocketGateway: WebsocketGateway,
  ) {}

  async create(createAuctionDto: CreateAuctionDto, creatorId: string) {
    const endsAt = new Date(createAuctionDto.endsAt);
    if (endsAt <= new Date()) {
      throw new BadRequestException('End date must be in the future');
    }

    const auction = this.auctionRepository.create({
      ...createAuctionDto,
      creatorId,
      currentPrice: createAuctionDto.startingPrice,
      status: AuctionStatus.ACTIVE,
      endsAt,
    });

    const savedAuction = await this.auctionRepository.save(auction);
    
    return {
      message: 'Auction created successfully! Your item is now live.',
      auction: savedAuction,
    };
  }

  async findAll(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }

    const [items, total] = await this.auctionRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['creator'],
      select: {
        id: true,
        title: true,
        description: true,
        startingPrice: true,
        currentPrice: true,
        status: true,
        endsAt: true,
        imageUrl: true,
        createdAt: true,
        creator: {
          id: true,
          email: true,
        },
      },
    });

    // Get bid counts for each auction
    const itemsWithBidCounts = await Promise.all(
      items.map(async (item) => {
        const bidCount = await this.bidRepository.count({
          where: { auctionItemId: item.id },
        });
        return {
          ...item,
          bidCount,
        };
      }),
    );

    return {
      items: itemsWithBidCounts,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const auction = await this.auctionRepository.findOne({
      where: { id },
      relations: ['creator', 'winner', 'bids', 'bids.bidder'],
      select: {
        id: true,
        title: true,
        description: true,
        startingPrice: true,
        currentPrice: true,
        status: true,
        endsAt: true,
        imageUrl: true,
        createdAt: true,
        creator: {
          id: true,
          email: true,
        },
        winner: {
          id: true,
          email: true,
        },
        bids: {
          id: true,
          amount: true,
          createdAt: true,
          bidder: {
            id: true,
            email: true,
          },
        },
      },
      order: {
        bids: {
          createdAt: 'DESC',
        },
      },
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    // Get last 20 bids
    if (auction.bids) {
      auction.bids = auction.bids.slice(0, 20);
    }

    return auction;
  }

  async placeBid(auctionId: string, placeBidDto: PlaceBidDto, bidderId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Use pessimistic locking: SELECT FOR UPDATE
      const auction = await queryRunner.manager.findOne(AuctionItem, {
        where: { id: auctionId },
        lock: { mode: 'pessimistic_write' },
        relations: ['bids'],
      });

      if (!auction) {
        throw new NotFoundException('Auction not found');
      }

      // Re-check endsAt inside the transaction (temporal validation)
      const now = new Date();
      if (auction.endsAt <= now) {
        throw new BadRequestException('Auction has ended');
      }

      if (auction.status !== AuctionStatus.ACTIVE) {
        throw new BadRequestException('Auction is not active');
      }

      if (auction.creatorId === bidderId) {
        throw new ForbiddenException('Cannot bid on your own auction');
      }

      if (placeBidDto.amount <= auction.currentPrice) {
        throw new BadRequestException(
          `Bid must be higher than current price: $${auction.currentPrice}`,
        );
      }

      // Get bidder with lock
      const bidder = await queryRunner.manager.findOne(User, {
        where: { id: bidderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!bidder) {
        throw new NotFoundException('Bidder not found');
      }

      // Check balance
      if (bidder.balance < placeBidDto.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Anti-sniping: extend auction if bid in final 10 seconds
      const secondsRemaining = (auction.endsAt.getTime() - now.getTime()) / 1000;
      if (secondsRemaining <= 10) {
        auction.endsAt = new Date(now.getTime() + 30 * 1000);
        await queryRunner.manager.save(auction);
      }

      // Find previous highest bidder
      const previousHighestBid = await queryRunner.manager.findOne(Bid, {
        where: { auctionItemId: auctionId },
        order: { amount: 'DESC' },
        relations: ['bidder'],
      });

      // Escrow: Deduct bid amount from bidder
      bidder.balance = Number(bidder.balance) - placeBidDto.amount;
      await queryRunner.manager.save(bidder);

      // Escrow: Refund previous highest bidder
      if (previousHighestBid && previousHighestBid.bidderId !== bidderId) {
        const previousBidder = await queryRunner.manager.findOne(User, {
          where: { id: previousHighestBid.bidderId },
          lock: { mode: 'pessimistic_write' },
        });
        if (previousBidder) {
          previousBidder.balance = Number(previousBidder.balance) + Number(previousHighestBid.amount);
          await queryRunner.manager.save(previousBidder);
        }
      }

      // Create bid
      const bid = queryRunner.manager.create(Bid, {
        amount: placeBidDto.amount,
        bidderId,
        auctionItemId: auctionId,
      });
      await queryRunner.manager.save(bid);

      // Update auction current price
      auction.currentPrice = placeBidDto.amount;
      await queryRunner.manager.save(auction);

      await queryRunner.commitTransaction();

      // Emit WebSocket events after transaction commits
      const bidderName = bidder.email.split('@')[0];
      const newBalance = Number(bidder.balance);
      
      // Emit comprehensive bid event with balance update
      this.websocketGateway.emitBidPlaced(auctionId, bidderId, {
        amount: placeBidDto.amount,
        bidderName,
        currentPrice: placeBidDto.amount,
        bidderBalance: newBalance,
      });

      // Emit balance update to previous bidder if refunded
      if (previousHighestBid && previousHighestBid.bidderId !== bidderId) {
        const previousBidderUpdated = await this.userRepository.findOne({
          where: { id: previousHighestBid.bidderId },
        });
        if (previousBidderUpdated) {
          this.websocketGateway.emitBalanceUpdate(
            previousHighestBid.bidderId,
            Number(previousBidderUpdated.balance),
          );
        }
      }

      return {
        ...bid,
        bidderBalance: newBalance,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findExpiredAuctions() {
    return this.auctionRepository.find({
      where: {
        status: AuctionStatus.ACTIVE,
        endsAt: LessThan(new Date()),
      },
      relations: ['creator', 'bids', 'bids.bidder'],
    });
  }

  async getDashboard(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [items, total] = await this.auctionRepository.findAndCount({
      where: {
        status: AuctionStatus.ACTIVE,
      },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['creator'],
      select: {
        id: true,
        title: true,
        description: true,
        startingPrice: true,
        currentPrice: true,
        status: true,
        endsAt: true,
        imageUrl: true,
        createdAt: true,
        creator: {
          id: true,
          email: true,
        },
      },
    });

    // Get bid counts for each auction
    const itemsWithBidCounts = await Promise.all(
      items.map(async (item) => {
        const bidCount = await this.bidRepository.count({
          where: { auctionItemId: item.id },
        });
        return {
          ...item,
          bidCount,
        };
      }),
    );

    return {
      items: itemsWithBidCounts,
      total,
      page,
      limit,
    };
  }

  async findByCreator(creatorId: string) {
    return this.auctionRepository.find({
      where: { creatorId },
      order: { createdAt: 'DESC' },
      relations: ['bids', 'winner'],
      select: {
        id: true,
        title: true,
        description: true,
        startingPrice: true,
        currentPrice: true,
        status: true,
        endsAt: true,
        imageUrl: true,
        createdAt: true,
        bids: {
          id: true,
          amount: true,
          createdAt: true,
        },
        winner: {
          id: true,
          email: true,
        },
      },
    });
  }
}

