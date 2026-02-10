import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Auctions')
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Create a new auction',
    description: 'Creates a new auction listing. Requires authentication. Image can be uploaded via multipart/form-data.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Vintage Watch' },
        description: { type: 'string', example: 'Beautiful vintage watch in excellent condition' },
        startingPrice: { type: 'number', example: 100.00 },
        endsAt: { type: 'string', format: 'date-time', example: '2024-01-20T12:00:00.000Z' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Auction image file (jpg, jpeg, png, gif, webp, max 1MB)'
        },
      },
      required: ['title', 'description', 'startingPrice', 'endsAt'],
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Auction created successfully',
    schema: {
      example: {
        message: 'Auction created successfully! Your item is now live.',
        auction: {
          id: 'uuid',
          title: 'Vintage Watch',
          description: 'Beautiful vintage watch',
          startingPrice: 100.00,
          currentPrice: 100.00,
          status: 'active',
          endsAt: '2024-01-20T12:00:00.000Z',
          imageUrl: '/uploads/auctions/image.jpg',
          createdAt: '2024-01-15T10:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Validation error or missing image' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/auctions',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `auction-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 1 * 1024 * 1024, // 1MB
      },
    }),
  )
  create(
    @Body() createAuctionDto: CreateAuctionDto,
    @CurrentUser() user: User,
    @UploadedFile() file?: any,
  ) {
    // Check if image is provided
   
    // Transform form data
    const auctionData = {
      title: createAuctionDto.title,
      description: createAuctionDto.description,
      startingPrice: typeof createAuctionDto.startingPrice === 'string' 
        ? parseFloat(createAuctionDto.startingPrice) 
        : createAuctionDto.startingPrice,
      endsAt: createAuctionDto.endsAt,
      // imageUrl: file ? `/uploads/auctions/${file.filename}` : null,
    };
    
    return this.auctionsService.create(auctionData, user.id);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all auctions',
    description: 'Returns paginated list of auctions. Can filter by status (active, sold, expired, or all).'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)', example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'sold', 'expired', 'all'], description: 'Filter by auction status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Auctions retrieved successfully',
    schema: {
      example: {
        message: 'Found 25 auction(s)',
        items: [],
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
        hasMore: true
      }
    }
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    // Support 'all' status to show all auctions
    const statusFilter = status === 'all' ? undefined : status;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.auctionsService.findAll(pageNum, limitNum, statusFilter);
  }

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get dashboard auctions',
    description: 'Returns active auctions for dashboard/homepage display. No authentication required.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)', example: 20 })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard auctions retrieved successfully',
  })
  getDashboard(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.auctionsService.getDashboard(pageNum, limitNum);
  }

  @Get('my-auctions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get my auctions',
    description: 'Returns all auctions created by the authenticated user.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User auctions retrieved successfully',
    schema: {
      example: {
        message: 'You have created 12 auction(s)',
        auctions: [],
        count: 12,
        timestamp: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyAuctions(@CurrentUser() user: User) {
    return this.auctionsService.findByCreator(user.id);
  }

  @Get('available')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get available auctions for bidding',
    description: 'Returns auctions that the authenticated user can bid on. Excludes auctions created by the user. Only shows active auctions that haven\'t ended.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)', example: 20 })
  @ApiResponse({ 
    status: 200, 
    description: 'Available auctions retrieved successfully',
    schema: {
      example: {
        message: 'Found 10 auction(s) available for bidding. These are auctions you can place bids on.',
        items: [],
        total: 10,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasMore: false,
        timestamp: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAvailableAuctions(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    // Exclude user's own auctions - show only auctions they can bid on
    return this.auctionsService.findAvailableAuctions(pageNum, limitNum, user.id);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get auction details',
    description: 'Returns detailed information about a specific auction including bids, creator, and winner (if sold).'
  })
  @ApiParam({ name: 'id', description: 'Auction ID (UUID)', example: 'uuid' })
  @ApiResponse({ 
    status: 200, 
    description: 'Auction details retrieved successfully',
    schema: {
      example: {
        message: 'Auction details retrieved successfully',
        auction: {
          id: 'uuid',
          title: 'Vintage Watch',
          description: 'Beautiful vintage watch',
          startingPrice: 100.00,
          currentPrice: 150.00,
          status: 'active',
          endsAt: '2024-01-20T12:00:00.000Z',
          creator: { email: 'creator@example.com' },
          bids: []
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }

  @Post(':id/bid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Place a bid on an auction',
    description: 'Places a bid on an auction. Bid amount must be higher than current price. User balance is deducted immediately. Previous highest bidder gets refunded. User cannot bid on their own auctions.'
  })
  @ApiParam({ name: 'id', description: 'Auction ID (UUID)', example: 'uuid' })
  @ApiBody({ type: PlaceBidDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Bid placed successfully',
    schema: {
      example: {
        message: 'Congratulations! Your bid of $150.00 is now the highest bid on "Vintage Watch". Your balance has been updated.',
        bid: {
          id: 'uuid',
          amount: 150.00,
          auctionItemId: 'uuid',
          createdAt: '2024-01-15T10:30:00.000Z'
        },
        auction: {
          id: 'uuid',
          title: 'Vintage Watch',
          currentPrice: 150.00,
          endsAt: '2024-01-20T12:00:00.000Z'
        },
        bidderBalance: 850.00,
        isHighestBid: true,
        previousHighestBid: {
          amount: 120.00,
          bidderId: 'uuid'
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Validation error',
    schema: {
      examples: {
        insufficientBalance: {
          value: {
            statusCode: 400,
            message: 'Insufficient balance. Your current balance is $50.00, but you need $150.00 to place this bid.'
          }
        },
        bidTooLow: {
          value: {
            statusCode: 400,
            message: 'Your bid of $100.00 must be higher than the current price of $120.00. Please increase your bid amount.'
          }
        },
        auctionEnded: {
          value: {
            statusCode: 400,
            message: 'This auction has ended on 1/15/2024, 12:00:00 PM. You can no longer place bids on this auction.'
          }
        },
        auctionNotActive: {
          value: {
            statusCode: 400,
            message: 'This auction is currently sold. Only active auctions can receive bids.'
          }
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Cannot bid on your own auction' })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  placeBid(
    @Param('id') id: string,
    @Body() placeBidDto: PlaceBidDto,
    @CurrentUser() user: User,
  ) {
    return this.auctionsService.placeBid(id, placeBidDto, user.id);
  }
}

