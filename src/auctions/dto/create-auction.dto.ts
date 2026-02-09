import { IsString, IsNumber, IsDateString, Min, MinLength, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateAuctionDto {
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title: string;

  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  description: string;

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

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

