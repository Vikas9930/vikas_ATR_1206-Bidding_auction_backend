import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './users/entities/user.entity';
import { AuctionItem } from './auctions/entities/auction-item.entity';
import { Bid } from './auctions/entities/bid.entity';
import { AuctionWin } from './auctions/entities/auction-win.entity';

export const dataSourceOptions: DataSourceOptions = {
  
  type: 'mysql',
  host: process.env.DB_HOST! || 'localhost',
  port: Number(process.env.DB_PORT) || 3307,
  username: process.env.DB_USERNAME! || 'root',
  password: process.env.DB_PASSWORD! || 'root',
  database: process.env.DB_NAME! || 'Bid_database',
  entities: [User, AuctionItem, Bid, AuctionWin],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' || true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
