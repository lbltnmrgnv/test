import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookPurchaseDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'book-atomic-habits' })
  @Transform(({ value }) => value?.trim())
  readonly bookId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'test-user-1' })
  @Transform(({ value }) => value?.trim())
  readonly customerId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({ example: 1, minimum: 1, maximum: 5 })
  @Transform(({ value }) => +value)
  readonly quantity: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'tok_visa_test',
    description: 'Use value with "fail" to emulate a declined payment',
  })
  @Transform(({ value }) => value?.trim())
  readonly paymentToken: string;
}
