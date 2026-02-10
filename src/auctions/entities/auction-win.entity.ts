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

@Entity('auction_wins')
@Index(['winnerId', 'endedAt'])
@Index(['auctionId'], { unique: true })
export class AuctionWin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  auctionId: string;

  @ManyToOne(() => AuctionItem)
  @JoinColumn({ name: 'auctionId' })
  auction: AuctionItem;

  @Column()
  winnerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'winnerId' })
  winner: User;

  @Column('decimal', { precision: 10, scale: 2 })
  finalPrice: number;

  @Column('timestamp')
  endedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

