import { Injectable } from '@nestjs/common';
import { BookPurchaseService } from '../book-purchase/book-purchase.service';
import { BookService } from '../book/book.service';
import { Order } from './models/order.model';

@Injectable()
export class OrderService {
  constructor(
    private readonly bookPurchaseService: BookPurchaseService,
    private readonly bookService: BookService,
  ) {}

  async getOrders(userId: string): Promise<Order[]> {
    const operations = await this.bookPurchaseService.getAllOperations(userId);
    return Promise.all(operations.map(operation => this.toOrder(operation)));
  }

  async getOrder(userId: string, operationId: string): Promise<Order> {
    const operation = await this.bookPurchaseService.findOperation(
      userId,
      operationId,
    );

    return this.toOrder(operation);
  }

  private async toOrder(operation: {
    operationId: string;
    status: any;
    bookId: string;
    quantity: number;
    amountCents: number;
    createdAt: string;
    processedAt?: string;
  }): Promise<Order> {
    const book = await this.bookService.findOne(operation.bookId);

    return {
      operationId: operation.operationId,
      status: operation.status,
      book: {
        id: operation.bookId,
        title: book?.title ?? 'Unknown book',
        author: book?.author ?? 'Unknown author',
      },
      quantity: operation.quantity,
      amountCents: operation.amountCents,
      createdAt: operation.createdAt,
      processedAt: operation.processedAt,
    };
  }
}
