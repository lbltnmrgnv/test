import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetBooksQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  readonly category?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    [0, 1, true, '0', '1', 'true', 'false'].includes(value)
      ? !!JSON.parse(value)
      : '',
  )
  readonly inStock?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => +value)
  readonly minPriceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => +value)
  readonly maxPriceCents?: number;
}
