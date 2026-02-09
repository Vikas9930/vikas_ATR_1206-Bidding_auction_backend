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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
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
    if (!file && !createAuctionDto.imageUrl) {
      throw new BadRequestException('Please upload an image');
    }

    // Transform form data
    const auctionData = {
      title: createAuctionDto.title,
      description: createAuctionDto.description,
      startingPrice: typeof createAuctionDto.startingPrice === 'string' 
        ? parseFloat(createAuctionDto.startingPrice) 
        : createAuctionDto.startingPrice,
      endsAt: createAuctionDto.endsAt,
      imageUrl: file ? `/uploads/auctions/${file.filename}` : createAuctionDto.imageUrl,
    };
    
    return this.auctionsService.create(auctionData, user.id);
  }

  @Get()
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
  getMyAuctions(@CurrentUser() user: User) {
    return this.auctionsService.findByCreator(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }

  @Post(':id/bid')
  @UseGuards(JwtAuthGuard)
  placeBid(
    @Param('id') id: string,
    @Body() placeBidDto: PlaceBidDto,
    @CurrentUser() user: User,
  ) {
    return this.auctionsService.placeBid(id, placeBidDto, user.id);
  }
}

