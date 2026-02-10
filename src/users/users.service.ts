import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AuctionItem, AuctionStatus } from '../auctions/entities/auction-item.entity';
import { AuctionWin } from '../auctions/entities/auction-win.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(AuctionItem)
    private auctionRepository: Repository<AuctionItem>,
    @InjectRepository(AuctionWin)
    private auctionWinRepository: Repository<AuctionWin>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async updateBalance(userId: string, amount: number): Promise<void> {
    await this.usersRepository.update(userId, {
      balance: () => `balance + ${amount}`,
    });
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['wonAuctions', 'createdAuctions'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      message: 'User profile retrieved successfully',
      user: {
        id: user.id,
        email: user.email,
        balance: Number(user.balance),
        createdAt: user.createdAt,
      },
    };
  }

  async getStatistics(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Use totalWins from user entity (maintained by settlement processor)
    // Count auctions created
    const auctionsCreatedCount = await this.auctionRepository.count({
      where: {
        creatorId: userId,
      },
    });

    return {
      message: 'User statistics retrieved successfully',
      statistics: {
        balance: Number(user.balance),
        auctionsWon: user.totalWins || 0,
        auctionsCreated: auctionsCreatedCount,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getWonAuctions(userId: string) {
    // Use AuctionWin history table for accurate history
    const winHistory = await this.auctionWinRepository.find({
      where: {
        winnerId: userId,
      },
      order: { endedAt: 'DESC' },
      relations: ['auction', 'auction.creator'],
      select: {
        id: true,
        auctionId: true,
        winnerId: true,
        finalPrice: true,
        endedAt: true,
        createdAt: true,
        auction: {
          id: true,
          title: true,
          description: true,
          startingPrice: true,
          currentPrice: true,
          status: true,
          endsAt: true,
          createdAt: true,
          creator: {
            id: true,
            email: true,
          },
        },
      },
    });

    const message = winHistory.length === 0
      ? 'You haven\'t won any auctions yet. Keep bidding to win!'
      : `You have won ${winHistory.length} auction(s). Congratulations!`;

    return {
      message,
      wins: winHistory.map(win => ({
        id: win.id,
        auctionId: win.auctionId,
        finalPrice: Number(win.finalPrice),
        endedAt: win.endedAt,
        createdAt: win.createdAt,
        auction: win.auction,
      })),
      count: winHistory.length,
      timestamp: new Date().toISOString(),
    };
  }

  async getWinHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [wins, total] = await this.auctionWinRepository.findAndCount({
      where: {
        winnerId: userId,
      },
      skip,
      take: limit,
      order: { endedAt: 'DESC' },
      relations: ['auction', 'auction.creator'],
    });

    return {
      message: `Found ${wins.length} win(s) in history`,
      wins: wins.map(win => ({
        id: win.id,
        auctionId: win.auctionId,
        finalPrice: Number(win.finalPrice),
        endedAt: win.endedAt,
        createdAt: win.createdAt,
        auction: win.auction,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      timestamp: new Date().toISOString(),
    };
  }
}

