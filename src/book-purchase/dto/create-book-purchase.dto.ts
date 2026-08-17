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
      'Mock payment token. Contains "fail" -> final status FAILED with wallet refund; contains "flaky" -> first attempt failed then retry; contains "slow" -> delayed processing',
  })
  @Transform(({ value }) => value?.trim())
  readonly paymentToken: string;
}
