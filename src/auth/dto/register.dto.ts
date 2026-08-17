import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsEmail()
  @ApiProperty({ example: 'alice@example.com' })
  @Transform(({ value }) => value?.trim())
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Alice' })
  @Transform(({ value }) => value?.trim())
  readonly name: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ example: 'secret123', minLength: 6 })
  readonly password: string;
}
