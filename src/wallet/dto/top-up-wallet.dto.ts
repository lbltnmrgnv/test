import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TopUpWalletDto {
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 5000, minimum: 1 })
  @Transform(({ value }) => +value)
  readonly amountCents: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Card top up', required: false })
  @Transform(({ value }) => value?.trim())
  readonly description?: string;
}
