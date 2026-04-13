import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PatchBookDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty({ example: 'Refactoring 2nd Edition', required: false })
  @Transform(({ value }) => value?.trim())
  readonly title?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty({ example: 'Martin Fowler', required: false })
  @Transform(({ value }) => value?.trim())
  readonly author?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty({ example: 'books', required: false })
  @Transform(({ value }) => value?.trim())
  readonly categorySlug?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiProperty({ example: 2990, minimum: 1, required: false })
  @Transform(({ value }) => +value)
  readonly priceCents?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiProperty({ example: 12, minimum: 0, required: false })
  @Transform(({ value }) => +value)
  readonly stock?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ example: true, required: false })
  @Transform(({ value }) =>
    [0, 1, true, '0', '1', 'true', 'false'].includes(value)
      ? !!JSON.parse(value)
      : value,
  )
  readonly active?: boolean;
}

