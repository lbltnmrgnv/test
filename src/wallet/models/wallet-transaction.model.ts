import { ApiProperty } from '@nestjs/swagger';

export enum WalletTransactionType {
  TOP_UP = 'TOP_UP',
  PURCHASE_RESERVE = 'PURCHASE_RESERVE',
  PURCHASE_REFUND = 'PURCHASE_REFUND',
}

export class WalletTransaction {
  @ApiProperty({ example: '5a4d9692-e8d8-470f-b4f9-e32f0f4dc5d5' })
  id: string;

  @ApiProperty({ example: '0c9f3e88-55cd-4f79-bff4-f44df4c6a540' })
  userId: string;

  @ApiProperty({ enum: WalletTransactionType })
  type: WalletTransactionType;

  @ApiProperty({ example: 5000 })
  amountCents: number;

  @ApiProperty({ example: 15000 })
  balanceAfterCents: number;

  @ApiProperty({ example: 'Wallet top up' })
  description: string;

  @ApiProperty({ example: '2026-05-06T10:00:00.000Z' })
  createdAt: string;
}
