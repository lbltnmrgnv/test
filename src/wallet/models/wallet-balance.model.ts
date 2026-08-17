import { ApiProperty } from '@nestjs/swagger';

export class WalletBalance {
  @ApiProperty({ example: 15000 })
  balanceCents: number;
}
