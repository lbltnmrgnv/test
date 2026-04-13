import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookPurchaseDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'book-atomic-habits',
    description: 'Book identifier from GET /books',
  })
  @Transform(({ value }) => value?.trim())
  readonly bookId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'test-user-1',
    description: 'Customer identifier used for rate limiting (3 requests per 60 seconds)',
  })
  @Transform(({ value }) => value?.trim())
  readonly customerId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({
    example: 1,
    minimum: 1,
    maximum: 5,
    description: 'Number of books to buy in a single operation',
  })
  @Transform(({ value }) => +value)
  readonly quantity: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'tok_visa_test',
    description:
      'Mock payment token. Contains "fail" -> FAILED, contains "flaky" -> first attempt FAILED then retry, contains "slow" -> delayed processing',
  })
  @Transform(({ value }) => value?.trim())
  readonly paymentToken: string;
}
