import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  BadRequestException,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookPurchaseService } from './book-purchase.service';
import { CreateBookPurchaseDto } from './dto/create-book-purchase.dto';
import { PurchaseOperation, PurchaseStatus } from './models/purchase-operation.model';
import { ReplayProviderEventDto } from './dto/replay-provider-event.dto';
import { FastifyRequest } from 'fastify';

@ApiTags('book-purchase')
@Controller('book-purchase')
export class BookPurchaseController {
  constructor(private readonly bookPurchaseService: BookPurchaseService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Create a book purchase operation',
    description:
      [
        'Creates async payment operation.',
        'Requires Idempotency-Key header.',
        'Reusing the same key with same payload returns the same operation; with different payload returns 409.',
        '',
        'Payment token hints for mock behavior:',
        '- token contains `fail` => final status `FAILED`.',
        '- token contains `flaky` => first attempt may fail, then retry.',
        '- token contains `slow` => processing takes longer than default.',
      ].join('\n'),
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Unique request key for deduplication of purchase creation',
    example: 'purchase-user-1-2026-04-13-001',
  })
  @ApiBody({
    type: CreateBookPurchaseDto,
    examples: {
      paid: {
        summary: 'Standard successful flow',
        value: {
          bookId: 'book-atomic-habits',
          customerId: 'user-1',
          quantity: 1,
          paymentToken: 'tok_visa_test',
        },
      },
      failed: {
        summary: 'Declined payment',
        value: {
          bookId: 'book-atomic-habits',
          customerId: 'user-2',
          quantity: 1,
          paymentToken: 'tok_fail_card',
        },
      },
      flaky: {
        summary: 'Flaky first attempt then retry',
        value: {
          bookId: 'book-ddd',
          customerId: 'user-3',
          quantity: 1,
          paymentToken: 'tok_flaky_gateway',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: PurchaseOperation })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Idempotency-Key was reused with a different payload',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded for customerId (3 creates per 60 seconds)',
  })
  async create(
    @Req() request: FastifyRequest,
    @Body() dto: CreateBookPurchaseDto,
  ): Promise<PurchaseOperation> {
    const rawIdempotencyKey = request.headers['idempotency-key'];
    const idempotencyKey = Array.isArray(rawIdempotencyKey)
      ? rawIdempotencyKey[0]
      : rawIdempotencyKey;

    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required.');
    }

    return this.bookPurchaseService.createOperation(idempotencyKey, dto);
  }

  @Get('operations')
  @ApiOperation({
    summary: 'List purchase operations',
    description: 'Returns all operations or filters them by operation status.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PurchaseStatus,
    description: 'Optional filter by status',
  })
  @ApiResponse({ status: HttpStatus.OK, type: PurchaseOperation, isArray: true })
  async getAll(
    @Query('status') status?: PurchaseStatus,
  ): Promise<PurchaseOperation[]> {
    if (status && !Object.values(PurchaseStatus).includes(status)) {
      throw new BadRequestException(
        `status must be one of: ${Object.values(PurchaseStatus).join(', ')}`,
      );
    }

    return this.bookPurchaseService.getAllOperations(status);
  }

  @Get('operations/:operationId')
  @ApiOperation({
    summary: 'Get operation by id',
    description: 'Use this endpoint to poll operation status until it becomes PAID or FAILED.',
  })
  @ApiParam({
    name: 'operationId',
    required: true,
    description: 'Operation identifier from POST /book-purchase response',
    example: '2ce2535d-d13b-4704-a708-e28845e57034',
  })
  @ApiResponse({ status: HttpStatus.OK, type: PurchaseOperation })
  async findOne(
    @Param('operationId') operationId: string,
  ): Promise<PurchaseOperation> {
    return this.bookPurchaseService.findOperation(operationId);
  }

  @Post('operations/:operationId/replay')
  @ApiOperation({
    summary: 'Replay payment provider event (technical)',
    description:
      'Testing-only endpoint to simulate duplicate/out-of-order provider callbacks and status transitions.',
  })
  @ApiParam({
    name: 'operationId',
    required: true,
    description: 'Target operation id',
    example: '2ce2535d-d13b-4704-a708-e28845e57034',
  })
  @ApiBody({
    type: ReplayProviderEventDto,
    examples: {
      paid: {
        summary: 'Replay PAID event',
        value: { status: 'PAID' },
      },
      failed: {
        summary: 'Replay FAILED event',
        value: { status: 'FAILED' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, type: PurchaseOperation })
  async replayEvent(
    @Param('operationId') operationId: string,
    @Body() dto: ReplayProviderEventDto,
  ): Promise<PurchaseOperation> {
    return this.bookPurchaseService.replayProviderEvent(operationId, dto.status);
  }
}
