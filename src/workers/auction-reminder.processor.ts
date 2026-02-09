import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Processor('auction-reminder')
@Injectable()
export class AuctionReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(AuctionReminderProcessor.name);

  constructor(private websocketGateway: WebsocketGateway) {
    super();
  }

  async process(job: Job<{ auctionId: string; endsAt: Date }>) {
    const { auctionId, endsAt } = job.data;
    
    const now = new Date();
    const secondsRemaining = Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / 1000));
    
    if (secondsRemaining <= 60) {
      this.logger.log(`Auction ${auctionId} ending soon: ${secondsRemaining} seconds remaining`);
      this.websocketGateway.emitAuctionEndingSoon(auctionId, secondsRemaining);
    }
    
    return { success: true };
  }
}

