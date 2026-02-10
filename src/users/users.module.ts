import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AuctionItem } from '../auctions/entities/auction-item.entity';
import { AuctionWin } from '../auctions/entities/auction-win.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuctionItem, AuctionWin])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

