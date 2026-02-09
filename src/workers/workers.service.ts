import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AuctionItem, AuctionStatus } from '../auctions/entities/auction-item.entity';

@Injectable()
export class WorkersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkersService.name);
  private settlementInterval: NodeJS.Timeout;

  constructor(
    @InjectQueue('auction-settlement')
    private settlementQueue: Queue,
    @InjectQueue('auction-reminder')
    private reminderQueue: Queue,
    @InjectRepository(AuctionItem)
    private auctionRepository: Repository<AuctionItem>,
  ) {}

  onModuleInit() {
    // Check for expired auctions every 5 seconds
    this.settlementInterval = setInterval(() => {
      this.checkExpiredAuctions();
    }, 5000);

    // Schedule reminders for auctions ending in 5 minutes
    this.scheduleReminders();
  }

  onModuleDestroy() {
    if (this.settlementInterval) {
      clearInterval(this.settlementInterval);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkExpiredAuctions() {
    const expiredAuctions = await this.auctionRepository.find({
      where: {
        status: AuctionStatus.ACTIVE,
        endsAt: LessThan(new Date()),
      },
    });

    for (const auction of expiredAuctions) {
      // Add job with unique ID to prevent duplicates
      await this.settlementQueue.add(
        `settle-${auction.id}`,
        { auctionId: auction.id },
        {
          jobId: `settle-${auction.id}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 1000,
          },
          removeOnFail: {
            age: 86400, // Keep failed jobs for 24 hours
          },
        },
      );
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async scheduleReminders() {
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    const oneMinuteFromNow = new Date(Date.now() + 60 * 1000);

    const auctionsNeedingReminder = await this.auctionRepository.find({
      where: {
        status: AuctionStatus.ACTIVE,
        endsAt: LessThan(fiveMinutesFromNow),
      },
    });

    for (const auction of auctionsNeedingReminder) {
      const secondsUntilEnd = Math.floor(
        (auction.endsAt.getTime() - Date.now()) / 1000,
      );

      if (secondsUntilEnd <= 60 && secondsUntilEnd > 0) {
        await this.reminderQueue.add(
          `remind-${auction.id}`,
          { auctionId: auction.id, endsAt: auction.endsAt },
          {
            jobId: `remind-${auction.id}`,
            delay: Math.max(0, secondsUntilEnd * 1000 - 60000), // Schedule for 1 minute before end
            attempts: 3,
            removeOnComplete: true,
          },
        );
      }
    }
  }
}

