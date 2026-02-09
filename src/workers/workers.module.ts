import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuctionSettlementProcessor } from './auction-settlement.processor';
import { OutbidNotificationProcessor } from './outbid-notification.processor';
import { AuctionReminderProcessor } from './auction-reminder.processor';
import { WorkersService } from './workers.service';
import { AuctionItem } from '../auctions/entities/auction-item.entity';
import { User } from '../users/entities/user.entity';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'auction-settlement',
      },
      {
        name: 'outbid-notification',
      },
      {
        name: 'auction-reminder',
      },
    ),
    TypeOrmModule.forFeature([AuctionItem, User]),
    ScheduleModule.forRoot(),
    WebsocketModule,
  ],
  providers: [
    AuctionSettlementProcessor,
    OutbidNotificationProcessor,
    AuctionReminderProcessor,
    WorkersService,
  ],
})
export class WorkersModule {}

