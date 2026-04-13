import { ApiProperty } from '@nestjs/swagger';

export enum PurchaseStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export class PurchaseOperation {
  @ApiProperty({ example: '2ce2535d-d13b-4704-a708-e28845e57034' })
  operationId: string;

  @ApiProperty({ enum: PurchaseStatus, example: PurchaseStatus.PENDING })
  status: PurchaseStatus;

  @ApiProperty({ example: 'book-atomic-habits' })
  bookId: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 2980 })
  amountCents: number;

  @ApiProperty({ example: 'test-user-1' })
  customerId: string;

  @ApiProperty({ example: 'order-123', required: false })
  externalPaymentId?: string;

  @ApiProperty({ example: 'PAYMENT_DECLINED', required: false })
  failureReason?: string;

  @ApiProperty({ example: '2026-04-13T10:17:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-04-13T10:17:02.000Z', required: false })
  processedAt?: string;

  @ApiProperty({ example: 1 })
  paymentAttempts: number;

  @ApiProperty({ example: '2026-04-13T10:17:01.000Z', required: false })
  lastEventAt?: string;

  @ApiProperty({
    example: 'purchase-user-1-2026-04-13-001',
    description: 'Deduplication key from request header Idempotency-Key',
  })
  idempotencyKey: string;
}
