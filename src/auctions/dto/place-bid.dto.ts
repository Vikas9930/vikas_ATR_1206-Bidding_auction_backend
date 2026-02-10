import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlaceBidDto {
  @ApiProperty({
    description: 'Bid amount (must be higher than current price)',
    example: 150.00,
    minimum: 0.01,
    type: Number,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;
}

