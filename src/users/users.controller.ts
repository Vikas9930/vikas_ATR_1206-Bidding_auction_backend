import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Returns the authenticated user\'s profile information including email, balance, and account creation date.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        message: 'User profile retrieved successfully',
        user: {
          id: 'uuid',
          email: 'user@example.com',
          balance: 1000.00,
          createdAt: '2024-01-15T10:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get user statistics',
    description: 'Returns user statistics including balance, total auctions won, and total auctions created. Used for dashboard display.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User statistics retrieved successfully',
    schema: {
      example: {
        message: 'User statistics retrieved successfully',
        statistics: {
          balance: 1000.00,
          auctionsWon: 5,
          auctionsCreated: 12
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatistics(@CurrentUser() user: User) {
    return this.usersService.getStatistics(user.id);
  }

  @Get('won-auctions')
  @ApiOperation({ 
    summary: 'Get won auctions',
    description: 'Returns all auctions that the authenticated user has won. Includes auction details and final price.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Won auctions retrieved successfully',
    schema: {
      example: {
        message: 'You have won 5 auction(s). Congratulations!',
        wins: [
          {
            id: 'win-uuid',
            auctionId: 'auction-uuid',
            finalPrice: 1500.00,
            endedAt: '2024-01-15T12:00:00.000Z',
            createdAt: '2024-01-15T12:00:01.000Z',
            auction: {
              id: 'auction-uuid',
              title: 'Vintage Watch',
              description: 'Beautiful vintage watch',
              creator: { email: 'creator@example.com' }
            }
          }
        ],
        count: 5,
        timestamp: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWonAuctions(@CurrentUser() user: User) {
    return this.usersService.getWonAuctions(user.id);
  }

  @Get('win-history')
  @ApiOperation({ 
    summary: 'Get paginated win history',
    description: 'Returns paginated list of auctions won by the authenticated user. Useful for displaying win history with pagination.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)', example: 20 })
  @ApiResponse({ 
    status: 200, 
    description: 'Win history retrieved successfully',
    schema: {
      example: {
        message: 'Found 10 win(s) in history',
        wins: [],
        total: 10,
        page: 1,
        limit: 20,
        totalPages: 1,
        timestamp: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWinHistory(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.usersService.getWinHistory(user.id, pageNum, limitNum);
  }
}

