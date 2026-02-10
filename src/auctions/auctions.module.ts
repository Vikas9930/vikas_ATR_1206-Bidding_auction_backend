import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { AuctionItem } from './entities/auction-item.entity';
import { Bid } from './entities/bid.entity';
import { AuctionWin } from './entities/auction-win.entity';
import { User } from '../users/entities/user.entity';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuctionItem, Bid, AuctionWin, User]),
    WebsocketModule,
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService],
  exports: [AuctionsService],
})
export class AuctionsModule {}

