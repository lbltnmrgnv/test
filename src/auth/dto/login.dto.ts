import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail()
  @ApiProperty({ example: 'demo@bookish.test' })
  @Transform(({ value }) => value?.trim())
  readonly email: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ example: 'bookish123', minLength: 6 })
  readonly password: string;
}
