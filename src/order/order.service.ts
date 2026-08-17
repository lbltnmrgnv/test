import { Injectable, NotFoundException } from '@nestjs/common';
import { BookPurchaseService } from '../book-purchase/book-purchase.service';
import { PurchaseOperation } from '../book-purchase/models/purchase-operation.model';
import { BookService } from '../book/book.service';
import { Order } from './models/order.model';

@Injectable()
export class OrderService {
  constructor(
    private readonly bookPurchaseService: BookPurchaseService,
    private readonly bookService: BookService,
  ) {}

  async getOrders(userId: string): Promise<Order[]> {
    const operations = await this.bookPurchaseService.getAllOperations();
    const userOperations = operations.filter(
      operation => operation.customerId === userId,
    );
    return Promise.all(userOperations.map(operation => this.toOrder(operation)));
  }

  async getOrder(userId: string, operationId: string): Promise<Order> {
    const operation = await this.bookPurchaseService.findOperation(operationId);

    if (operation.customerId !== userId) {
      throw new NotFoundException('Order not found.');
    }

    return this.toOrder(operation);
  }

  private async toOrder(operation: PurchaseOperation): Promise<Order> {
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
