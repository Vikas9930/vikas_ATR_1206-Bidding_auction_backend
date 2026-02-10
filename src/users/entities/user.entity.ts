import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { AuctionItem } from '../../auctions/entities/auction-item.entity';
import { Bid } from '../../auctions/entities/bid.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column('int', { default: 0 })
  totalWins: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => AuctionItem, (auction) => auction.creator)
  createdAuctions: AuctionItem[];

  @OneToMany(() => Bid, (bid) => bid.bidder)
  bids: Bid[];

  @OneToMany(() => AuctionItem, (auction) => auction.winner)
  wonAuctions: AuctionItem[];
}

