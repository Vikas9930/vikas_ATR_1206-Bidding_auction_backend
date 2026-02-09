import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AuctionItem } from './auction-item.entity';

@Entity('bids')
@Index(['auctionItemId', 'createdAt'])
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  bidderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'bidderId' })
  bidder: User;

  @Column()
  auctionItemId: string;

  @ManyToOne(() => AuctionItem, (auction) => auction.bids)
  @JoinColumn({ name: 'auctionItemId' })
  auctionItem: AuctionItem;

  @CreateDateColumn()
  createdAt: Date;
}

