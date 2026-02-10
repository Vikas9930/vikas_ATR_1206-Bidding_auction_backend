import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, LessThan, MoreThan, Not } from 'typeorm';
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
      throw new BadRequestException(
        'The auction end date must be in the future. Please select a date and time that is later than now.',
      );
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
        // imageUrl: true,
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

    const message = itemsWithBidCounts.length === 0
      ? 'No auctions found matching your criteria.'
      : `Found ${itemsWithBidCounts.length} auction(s)`;

    return {
      message,
      items: itemsWithBidCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
      timestamp: new Date().toISOString(),
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
        // imageUrl: true,
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
      throw new NotFoundException(`Auction with ID ${id} not found. Please check the auction ID and try again.`);
    }

    // Get last 20 bids
    if (auction.bids) {
      auction.bids = auction.bids.slice(0, 20);
    }

    return {
      message: 'Auction details retrieved successfully',
      auction,
    };
  }

  async placeBid(auctionId: string, placeBidDto: PlaceBidDto, bidderId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Use pessimistic locking: SELECT FOR UPDATE
      // Don't load bids relation to avoid TypeORM trying to sync it when saving
      const auction = await queryRunner.manager.findOne(AuctionItem, {
        where: { id: auctionId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!auction) {
        throw new NotFoundException(`Auction with ID ${auctionId} not found. Please check the auction ID and try again.`);
      }

      // Re-check endsAt inside the transaction (temporal validation)
      const now = new Date();
      if (auction.endsAt <= now) {
        throw new BadRequestException(
          `This auction has ended on ${auction.endsAt.toLocaleString()}. You can no longer place bids on this auction.`,
        );
      }

      if (auction.status !== AuctionStatus.ACTIVE) {
        throw new BadRequestException(
          `This auction is currently ${auction.status}. Only active auctions can receive bids.`,
        );
      }

      if (auction.creatorId === bidderId) {
        throw new ForbiddenException(
          'You cannot bid on your own auction. Please bid on auctions created by other users.',
        );
      }

      if (placeBidDto.amount <= auction.currentPrice) {
        throw new BadRequestException(
          `Your bid of $${placeBidDto.amount.toFixed(2)} must be higher than the current price of $${Number(auction.currentPrice).toFixed(2)}. Please increase your bid amount.`,
        );
      }

      // Get bidder with lock
      const bidder = await queryRunner.manager.findOne(User, {
        where: { id: bidderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!bidder) {
        throw new NotFoundException('User account not found. Please try logging in again.');
      }

      // Check balance
      const currentBalance = Number(bidder.balance);
      if (currentBalance < placeBidDto.amount) {
        throw new BadRequestException(
          `Insufficient balance. Your current balance is $${currentBalance.toFixed(2)}, but you need $${placeBidDto.amount.toFixed(2)} to place this bid.`,
        );
      }

      // Anti-sniping: extend auction if bid in final 10 seconds
      const secondsRemaining = (auction.endsAt.getTime() - now.getTime()) / 1000;
      if (secondsRemaining <= 10) {
        const newEndsAt = new Date(now.getTime() + 30 * 1000);
        // Use update instead of save to avoid TypeORM trying to sync relations
        await queryRunner.manager.update(AuctionItem, { id: auctionId }, {
          endsAt: newEndsAt,
        });
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
      // Use update instead of save to avoid TypeORM trying to sync relations
      await queryRunner.manager.update(AuctionItem, { id: auctionId }, {
        currentPrice: placeBidDto.amount,
      });

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

      // Check if this is the highest bid
      const isHighestBid = !previousHighestBid || placeBidDto.amount > previousHighestBid.amount;
      
      return {
        message: isHighestBid 
          ? `Congratulations! Your bid of $${placeBidDto.amount.toFixed(2)} is now the highest bid on "${auction.title}". Your balance has been updated.`
          : `Bid placed successfully! Your bid of $${placeBidDto.amount.toFixed(2)} has been recorded. Your balance has been updated.`,
        bid: {
          id: bid.id,
          amount: bid.amount,
          auctionItemId: bid.auctionItemId,
          createdAt: bid.createdAt,
        },
        auction: {
          id: auction.id,
          title: auction.title,
          currentPrice: auction.currentPrice,
          endsAt: auction.endsAt,
        },
        bidderBalance: newBalance,
        isHighestBid,
        previousHighestBid: previousHighestBid ? {
          amount: previousHighestBid.amount,
          bidderId: previousHighestBid.bidderId,
        } : null,
        timestamp: new Date().toISOString(),
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
        // imageUrl: true,
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

    const message = itemsWithBidCounts.length === 0
      ? 'No active auctions on dashboard at the moment. Create an auction to get started!'
      : `Found ${itemsWithBidCounts.length} active auction(s) on dashboard`;

    return {
      message,
      items: itemsWithBidCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
      timestamp: new Date().toISOString(),
    };
  }

  async findByCreator(creatorId: string) {
    const auctions = await this.auctionRepository.find({
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
        // imageUrl: true,
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

    const message = auctions.length === 0
      ? 'You haven\'t created any auctions yet. Click "Create Auction" to get started!'
      : `You have created ${auctions.length} auction(s)`;

    return {
      message,
      auctions,
      count: auctions.length,
      timestamp: new Date().toISOString(),
    };
  }

  async findAvailableAuctions(page = 1, limit = 20, userId?: string) {
    const skip = (page - 1) * limit;
    const now = new Date();
    
    const where: any = {
      status: AuctionStatus.ACTIVE,
      endsAt: MoreThan(now),
    };
    
    // Exclude user's own auctions if userId is provided
    if (userId) {
      where.creatorId = Not(userId);
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
        // imageUrl: true,
        createdAt: true,
        creator: {
          id: true,
          email: true,
        },
      },
    });

    // Get bid counts and time remaining for each auction
    const itemsWithBidCounts = await Promise.all(
      items.map(async (item) => {
        const bidCount = await this.bidRepository.count({
          where: { auctionItemId: item.id },
        });
        const timeRemaining = Math.max(0, item.endsAt.getTime() - now.getTime());
        const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
          ...item,
          bidCount,
          timeRemaining: {
            milliseconds: timeRemaining,
            hours: hoursRemaining,
            minutes: minutesRemaining,
            formatted: `${hoursRemaining}h ${minutesRemaining}m`,
          },
        };
      }),
    );

    const message = itemsWithBidCounts.length === 0
      ? userId
        ? 'No auctions available for bidding at the moment. Check back later for new auctions!'
        : 'No active auctions found at the moment.'
      : userId
        ? `Found ${itemsWithBidCounts.length} auction(s) available for bidding. These are auctions you can place bids on.`
        : `Found ${itemsWithBidCounts.length} active auction(s)`;

    return {
      message,
      items: itemsWithBidCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
      timestamp: new Date().toISOString(),
    };
  }
}

