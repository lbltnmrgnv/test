import {
  IsOptional,
  IsString,
  IsBoolean,
  Max,
  Min,
  IsInt,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryParams {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @ApiProperty({
    description: 'Filter categories by name',
    example: 'Scientific literature',
    required: false,
  })
  readonly name?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @ApiProperty({
    description: 'Filter categories by description',
    example: 'Popular science books',
    required: false,
  })
  readonly description?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    [0, 1, true, '0', '1', 'true', 'false'].includes(value)
      ? !!JSON.parse(value)
      : '',
  )
  @ApiProperty({
    description: 'Filter categories by state',
    enum: [true, 1, 0],
    required: false,
  })
  readonly active?: boolean;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @ApiProperty({
    description: 'Filter categories by name or description',
    example: 'Popular science books',
    required: false,
  })
  readonly search?: string;

  @IsInt()
  @Min(1)
  @Max(9)
  @IsOptional()
  @Type(() => Number)
  @ApiProperty()
  @ApiProperty({
    description: 'Number of categories per page',
    example: 3,
    default: 2,
    required: false,
  })
  readonly pageSize?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  @ApiProperty({
    description: 'Page number',
    required: false,
  })
  readonly page?: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) =>
    ['id', 'slug', 'name', 'description', 'createdDate', 'active'].includes(
      value.startsWith('-') ? value.slice(1) : value,
    )
      ? value?.trim()
      : '-createdDate',
  )
  @ApiProperty({
    description: 'Category sorting parameter.',
    required: false,
    enum: ['id', 'slug', 'name', 'description', 'createdDate', 'active'],
  })
  readonly sort?: string;
}
