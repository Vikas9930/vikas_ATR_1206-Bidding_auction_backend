import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';

@Processor('outbid-notification')
@Injectable()
export class OutbidNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(OutbidNotificationProcessor.name);

  async process(job: Job<{ userId: string; auctionId: string; auctionTitle: string; amount: number }>) {
    const { userId, auctionId, auctionTitle, amount } = job.data;
    
    // Simulate notification delivery by logging
    this.logger.log(
      `[NOTIFICATION] User ${userId} has been outbid on auction "${auctionTitle}" (${auctionId}). New bid: $${amount}`,
    );
    
    // In a real system, you would:
    // - Send email notification
    // - Send push notification
    // - Send in-app notification
    // - etc.
    
    return { success: true };
  }
}

