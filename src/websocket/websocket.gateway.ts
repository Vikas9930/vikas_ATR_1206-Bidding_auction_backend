import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },


  namespace: '/',
})


export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{

  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly viewerCounts = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}
  

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || 
                   client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      console.log(token, 'token');
      if (!token) {
        this.logger.warn('Connection rejected: No token provided');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      console.log(payload, 'payload');
      const user = await this.usersService.findOne(payload.sub);
      console.log(user, 'user');
      if (!user) {
        this.logger.warn('Connection rejected: User not found');
        client.disconnect();
        return;
      } 

      client.userId = user.id;
      console.log(client.userId, 'client.userId');
      // Join user-specific room for balance updates
      client.join(`user:${user.id}`);
      
      // Send initial balance to user
      client.emit('BALANCE_UPDATED', {
        balance: Number(user.balance),
        timestamp: new Date().toISOString(),
      });
      
      this.logger.log(`Client connected: ${user.email} (${client.id})`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove from all viewer counts
    this.viewerCounts.forEach((viewers, auctionId) => {
      if (viewers.has(client.id)) {
        viewers.delete(client.id);
        this.broadcastViewerCount(auctionId);
      }
    });
  }

  @SubscribeMessage('join_auction')
  handleJoinAuction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { auctionId: string },
  ) {
    if (!client.userId) {
      return;
    }

    const room = `auction:${data.auctionId}`;
    client.join(room);
    
    // Track viewer
    if (!this.viewerCounts.has(data.auctionId)) {
      this.viewerCounts.set(data.auctionId, new Set());
    }
    this.viewerCounts.get(data.auctionId)!.add(client.id);
    
    this.broadcastViewerCount(data.auctionId);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
  }

  @SubscribeMessage('leave_auction')
  handleLeaveAuction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { auctionId: string },
  ) {
    const room = `auction:${data.auctionId}`;
    client.leave(room);
    
    // Remove from viewer count
    const viewers = this.viewerCounts.get(data.auctionId);
    if (viewers) {
      viewers.delete(client.id);
      this.broadcastViewerCount(data.auctionId);
    }
    
    this.logger.log(`Client ${client.id} left room: ${room}`);
  }

  emitNewBid(auctionId: string, data: { 
    amount: number; 
    bidderName: string; 
    bidderId: string;
    timestamp: string;
    currentPrice: number;
  }) {
    // Emit to all users watching this auction
    this.server.to(`auction:${auctionId}`).emit('NEW_BID', {
      auctionId,
      ...data,
    });
    
    // Also emit to update auction list
    this.server.emit('AUCTION_UPDATED', {
      auctionId,
      currentPrice: data.currentPrice,
    });
  }

  emitBalanceUpdate(userId: string, newBalance: number) {
    // Emit balance update to specific user
    this.server.to(`user:${userId}`).emit('BALANCE_UPDATED', {
      balance: newBalance,
      timestamp: new Date().toISOString(),
    });
  }

  emitBidPlaced(auctionId: string, bidderId: string, data: {
    amount: number;
    bidderName: string;
    currentPrice: number;
    bidderBalance: number;
  }) {
    // Emit to auction room
    this.server.to(`auction:${auctionId}`).emit('NEW_BID', {
      auctionId,
      amount: data.amount,
      bidderName: data.bidderName,
      bidderId,
      currentPrice: data.currentPrice,
      timestamp: new Date().toISOString(),
    });

    // Emit balance update to bidder
    this.emitBalanceUpdate(bidderId, data.bidderBalance);

    // Emit auction price update to all
    this.server.emit('AUCTION_PRICE_UPDATED', {
      auctionId,
      currentPrice: data.currentPrice,
    });
  }

  emitAuctionEndingSoon(auctionId: string, secondsRemaining: number) {
    this.server.to(`auction:${auctionId}`).emit('AUCTION_ENDING_SOON', {
      auctionId,
      secondsRemaining,
    });
  }

  emitAuctionSold(auctionId: string, winnerId: string, winnerName: string, finalPrice: number) {
    this.server.to(`auction:${auctionId}`).emit('AUCTION_SOLD', {
      auctionId,
      winnerId,
      winnerName,
      finalPrice,
      timestamp: new Date().toISOString(),
    });
  }

  emitAuctionWon(winnerId: string, data: {
    auctionId: string;
    auctionTitle: string;
    finalPrice: number;
    winnerName: string;
  }) {
    // Emit to winner's private room
    this.server.to(`user:${winnerId}`).emit('AUCTION_WON', {
      message: `Congratulations! You won the auction "${data.auctionTitle}" for $${data.finalPrice.toFixed(2)}!`,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitAuctionExpired(auctionId: string) {
    this.server.to(`auction:${auctionId}`).emit('AUCTION_EXPIRED', {
      auctionId,
    });
  }

  private broadcastViewerCount(auctionId: string) {
    const count = this.viewerCounts.get(auctionId)?.size || 0;
    this.server.to(`auction:${auctionId}`).emit('VIEWER_COUNT', {
      auctionId,
      count,
    });
  }
}

