import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({ example: '0c9f3e88-55cd-4f79-bff4-f44df4c6a540' })
  id: string;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiProperty({ example: 'Alice' })
  name: string;

  passwordHash: string;

  @ApiProperty({ example: 15000 })
  walletBalanceCents: number;

  @ApiProperty({ example: '2026-05-06T10:00:00.000Z' })
  createdAt: string;
}
