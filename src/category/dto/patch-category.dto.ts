import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PatchCategoryDto {
  @IsString()
  @Matches(/^[a-zA-Z\-]+$/)
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Unique category name',
    example: 'Books',
  })
  @Transform(({ value }) => value?.trim())
  readonly slug?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Category name',
    example: 'Scientific literature',
  })
  @Transform(({ value }) => value?.trim())
  readonly name?: string;

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
  @Transform(({ value }) =>
    [0, 1, true, '0', '1', 'true', 'false'].includes(value)
      ? !!JSON.parse(value)
      : '',
  )
  @ApiProperty({
    description: 'Category state',
    enum: [true, false, 1, 0],
  })
  readonly active?: boolean;
}
