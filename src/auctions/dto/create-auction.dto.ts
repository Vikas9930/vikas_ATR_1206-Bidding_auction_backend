import { IsString, IsNumber, IsDateString, Min, MinLength, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuctionDto {
  @ApiProperty({
    description: 'Auction title',
    example: 'Vintage Watch',
    minLength: 3,
    type: String,
  })
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the auction item',
    example: 'Beautiful vintage watch in excellent condition. Original box included.',
    minLength: 10,
    type: String,
  })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  description: string;

  @ApiProperty({
    description: 'Starting price for the auction',
    example: 100.00,
    minimum: 0.01,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Starting price must be a number' })
  @Min(0.01, { message: 'Starting price must be at least 0.01' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  startingPrice: number;

  @ApiProperty({
    description: 'Auction end date and time (ISO 8601 format)',
    example: '2024-01-20T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsString()
  @IsDateString({}, { message: 'End date must be a valid ISO 8601 date string' })
  @Transform(({ value }) => {
    // Handle form data date strings
    if (value && typeof value === 'string') {
      return value;
    }
    return value;
  })
  endsAt: string;

  // @ApiProperty({
  //   description: 'Image URL (optional if uploading file)',
  //   required: false,
  //   type: String,
  // })
  // @IsString()
  // @IsOptional()
  // imageUrl?: string;
}

