import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BookService } from '../book/book.service';
import { CreateBookPurchaseDto } from './dto/create-book-purchase.dto';
import { PurchaseOperation, PurchaseStatus } from './models/purchase-operation.model';

interface PaymentResult {
  status: PurchaseStatus.PAID | PurchaseStatus.FAILED;
  externalPaymentId?: string;
  failureReason?: string;
}

@Injectable()
export class BookPurchaseService {
  private readonly filePath = join(
    process.cwd(),
    'src',
    'data',
    'purchase-operations.json',
  );

  private static readonly createRateLimit = 3;
  private static readonly createRateLimitWindowMs = 60 * 1000;

  constructor(private readonly bookService: BookService) {}

  async createOperation(
    idempotencyKey: string,
    dto: CreateBookPurchaseDto,
  ): Promise<PurchaseOperation> {
    const operations = await this.readOperations();
    this.ensureCreateRateLimit(dto.customerId, operations);

    const existingOperation = operations.find(
      operation => operation.idempotencyKey === idempotencyKey,
    );

    if (existingOperation) {
      this.ensureIdempotencyPayload(existingOperation, dto, idempotencyKey);
      return existingOperation;
    }

    const book = await this.bookService.findOne(dto.bookId);
    if (!book || !book.active) {
      throw new NotFoundException('Book not found.');
    }

    if (book.stock < dto.quantity) {
      throw new BadRequestException('Not enough books in stock.');
    }

    const operation: PurchaseOperation = {
      operationId: uuidv4(),
      status: PurchaseStatus.PENDING,
      bookId: dto.bookId,
      quantity: dto.quantity,
      customerId: dto.customerId,
      amountCents: dto.quantity * book.priceCents,
      idempotencyKey,
      paymentAttempts: 0,
      createdAt: new Date().toISOString(),
    };

    operations.push(operation);
    await this.writeOperations(operations);

    this.processOperationAsync(operation.operationId, dto.paymentToken);

    return operation;
  }

  async findOperation(operationId: string): Promise<PurchaseOperation> {
    const operations = await this.readOperations();
    const operation = operations.find(item => item.operationId === operationId);

    if (!operation) {
      throw new NotFoundException('Operation not found.');
    }

    return operation;
  }

  async getAllOperations(status?: PurchaseStatus): Promise<PurchaseOperation[]> {
    const operations = await this.readOperations();

    if (!status) {
      return operations;
    }

    return operations.filter(operation => operation.status === status);
  }

  async replayProviderEvent(
    operationId: string,
    status: PurchaseStatus,
  ): Promise<PurchaseOperation> {
    if (status === PurchaseStatus.PENDING) {
      throw new BadRequestException('Replay status must be PAID or FAILED.');
    }

    const operations = await this.readOperations();
    const operationIndex = operations.findIndex(
      operation => operation.operationId === operationId,
    );

    if (operationIndex === -1) {
      throw new NotFoundException('Operation not found.');
    }

    const operation = operations[operationIndex];

    operation.paymentAttempts += 1;
    operation.status = status;
    operation.lastEventAt = new Date().toISOString();
    operation.processedAt = operation.lastEventAt;

    if (status === PurchaseStatus.PAID) {
      operation.externalPaymentId = `mock-replay-${operationId.slice(0, 8)}`;
      operation.failureReason = undefined;
      await this.bookService.reduceStock(operation.bookId, operation.quantity);
    }

    if (status === PurchaseStatus.FAILED) {
      operation.failureReason = 'REPLAYED_PROVIDER_FAILURE';
      operation.externalPaymentId = undefined;
    }

    operations[operationIndex] = operation;
    await this.writeOperations(operations);

    return operation;
  }

  private processOperationAsync(operationId: string, paymentToken: string): void {
    const delayMs = this.resolveProcessingDelayMs(paymentToken);

    const timer = setTimeout(async () => {
      const operations = await this.readOperations();
      const operationIndex = operations.findIndex(
        operation => operation.operationId === operationId,
      );

      if (operationIndex === -1) {
        return;
      }

      if (operations[operationIndex].status !== PurchaseStatus.PENDING) {
        return;
      }

      const operation = operations[operationIndex];
      operation.paymentAttempts += 1;

      const paymentResult = this.mockCharge(paymentToken, operationId, operation.paymentAttempts);
      operation.status = paymentResult.status;
      operation.externalPaymentId = paymentResult.externalPaymentId;
      operation.failureReason = paymentResult.failureReason;
      operation.lastEventAt = new Date().toISOString();
      operation.processedAt = operation.lastEventAt;

      if (paymentResult.status === PurchaseStatus.PAID) {
        await this.bookService.reduceStock(operation.bookId, operation.quantity);
      }

      operations[operationIndex] = operation;
      await this.writeOperations(operations);

      if (
        paymentToken.toLowerCase().includes('flaky') &&
        paymentResult.status === PurchaseStatus.FAILED
      ) {
        this.processOperationAsync(operationId, paymentToken.replace(/flaky/gi, 'fixed'));
      }
    }, delayMs);

    timer.unref?.();
  }

  private ensureCreateRateLimit(
    customerId: string,
    operations: PurchaseOperation[],
  ): void {
    const now = Date.now();
    const attemptsInWindow = operations.filter(operation => {
      if (operation.customerId !== customerId) {
        return false;
      }

      const createdAtTime = new Date(operation.createdAt).getTime();
      return now - createdAtTime < BookPurchaseService.createRateLimitWindowMs;
    }).length;

    if (attemptsInWindow >= BookPurchaseService.createRateLimit) {
      throw new HttpException(
        'Too many purchase attempts. Retry after 60 seconds.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private ensureIdempotencyPayload(
    operation: PurchaseOperation,
    dto: CreateBookPurchaseDto,
    idempotencyKey: string,
  ): void {
    if (
      operation.bookId !== dto.bookId ||
      operation.customerId !== dto.customerId ||
      operation.quantity !== dto.quantity
    ) {
      throw new ConflictException(
        `Idempotency-Key ${idempotencyKey} was already used with another payload.`,
      );
    }
  }

  private resolveProcessingDelayMs(paymentToken: string): number {
    if (paymentToken.toLowerCase().includes('slow')) {
      return 4000;
    }

    return 1200;
  }

  private mockCharge(
    paymentToken: string,
    operationId: string,
    paymentAttempt: number,
  ): PaymentResult {
    const normalizedToken = paymentToken.toLowerCase();

    if (normalizedToken.includes('fail')) {
      return {
        status: PurchaseStatus.FAILED,
        failureReason: 'PAYMENT_DECLINED',
      };
    }

    if (normalizedToken.includes('flaky') && paymentAttempt === 1) {
      return {
        status: PurchaseStatus.FAILED,
        failureReason: 'GATEWAY_TIMEOUT',
      };
    }

    return {
      status: PurchaseStatus.PAID,
      externalPaymentId: `mock-pay-${operationId.slice(0, 8)}`,
    };
  }

  private async readOperations(): Promise<PurchaseOperation[]> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(raw) as PurchaseOperation[];
    } catch {
      return [];
    }
  }

  private async writeOperations(operations: PurchaseOperation[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(operations, null, 2));
  }
}
