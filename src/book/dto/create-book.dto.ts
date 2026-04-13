import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9\-]+$/)
  @ApiProperty({ example: 'book-refactoring' })
  @Transform(({ value }) => value?.trim())
  readonly id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Refactoring' })
  @Transform(({ value }) => value?.trim())
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Martin Fowler' })
  @Transform(({ value }) => value?.trim())
  readonly author: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'books' })
  @Transform(({ value }) => value?.trim())
  readonly categorySlug: string;

  @IsInt()
  @Min(1)
  @ApiProperty({ example: 2890, minimum: 1 })
  @Transform(({ value }) => +value)
  readonly priceCents: number;

  @IsInt()
  @Min(0)
  @ApiProperty({ example: 5, minimum: 0 })
  @Transform(({ value }) => +value)
  readonly stock: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ example: true, required: false, default: true })
  @Transform(({ value }) =>
    [0, 1, true, '0', '1', 'true', 'false'].includes(value)
      ? !!JSON.parse(value)
      : value,
  )
  readonly active?: boolean;
}

