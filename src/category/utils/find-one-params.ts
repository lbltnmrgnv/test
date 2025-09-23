import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindOneParams {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'Unique category identifier. Slug or Id',
  })
  readonly identifier: string;
}
