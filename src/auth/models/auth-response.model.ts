import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/user.model';

class SafeUser {
  @ApiProperty({ example: '0c9f3e88-55cd-4f79-bff4-f44df4c6a540' })
  id: string;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiProperty({ example: 'Alice' })
  name: string;

  @ApiProperty({ example: 15000 })
  walletBalanceCents: number;

  @ApiProperty({ example: '2026-05-06T10:00:00.000Z' })
  createdAt: string;
}

export class AuthResponse {
  @ApiProperty({ example: 'c4c67a2b-1508-4a49-a94b-b3b779b9a52d' })
  accessToken: string;

  @ApiProperty({ example: '3e28c19c-b348-44c5-832f-b1f7d9d4c490' })
  refreshToken: string;

  @ApiProperty({ type: SafeUser })
  user: Omit<User, 'passwordHash'>;
}
