import { ApiProperty } from '@nestjs/swagger';
import { PurchaseStatus } from '../../book-purchase/models/purchase-operation.model';

class OrderBook {
  @ApiProperty({ example: 'book-atomic-habits' })
  id: string;

  @ApiProperty({ example: 'Atomic Habits' })
  title: string;

  @ApiProperty({ example: 'James Clear' })
  author: string;
}

export class Order {
  @ApiProperty({ example: '2ce2535d-d13b-4704-a708-e28845e57034' })
  operationId: string;

  @ApiProperty({ enum: PurchaseStatus, example: PurchaseStatus.PAID })
  status: PurchaseStatus;

  @ApiProperty({ type: OrderBook })
  book: OrderBook;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 2980 })
  amountCents: number;

  @ApiProperty({ example: '2026-05-06T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-06T10:00:02.000Z', required: false })
  processedAt?: string;
}
