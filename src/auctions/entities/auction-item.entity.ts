import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Bid } from './bid.entity';

export enum AuctionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SOLD = 'sold',
  EXPIRED = 'expired',
}

@Entity('auction_items')
@Index(['status', 'endsAt'])
export class AuctionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  startingPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  currentPrice: number;

  @Column({
    type: 'enum',
    enum: AuctionStatus,
    default: AuctionStatus.DRAFT,
  })
  status: AuctionStatus;

  @Column()
  creatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column({ nullable: true })
  winnerId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'winnerId' })
  winner: User | null;

  @Column('timestamp')
  @Index()
  endsAt: Date;

  // @Column({ type: 'varchar', length: 1000, nullable: true })
  // imageUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Bid, (bid) => bid.auctionItem, { cascade: true })
  bids: Bid[];
}

