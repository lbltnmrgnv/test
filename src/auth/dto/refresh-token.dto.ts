import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '3e28c19c-b348-44c5-832f-b1f7d9d4c490' })
  readonly refreshToken: string;
}
