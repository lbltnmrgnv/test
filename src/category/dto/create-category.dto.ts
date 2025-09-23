import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsString()
  @Matches(/^[a-z\-@!#' ']+$/)
  @ApiProperty({
    description: 'Unique category name',
    example: 'Books',
  })
  @Transform(({ value }) => value?.trim())
  readonly slug: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Category name',
    example: 'Scientific literature',
  })
  @Transform(({ value }) => value?.trim())
  readonly name: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Category description',
    example: 'Popular science books',
  })
  @Transform(({ value }) => value?.trim())
  readonly description?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'Category state',
    enum: [true, false, 1, 0],
  })
  @Transform(({ value }) =>
    [0, 1, true, '0', '1', 'true', 'false', 'save'].includes(value)
      ? !!JSON.parse(value)
      : '',
  )
  readonly active: boolean;
}
