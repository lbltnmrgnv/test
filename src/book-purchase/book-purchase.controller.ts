import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookPurchaseService } from './book-purchase.service';
import { CreateBookPurchaseDto } from './dto/create-book-purchase.dto';
import { PurchaseOperation, PurchaseStatus } from './models/purchase-operation.model';
import { ReplayProviderEventDto } from './dto/replay-provider-event.dto';

@ApiTags('book-purchase')
@Controller('book-purchase')
export class BookPurchaseController {
  constructor(private readonly bookPurchaseService: BookPurchaseService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: PurchaseOperation })
  async create(
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() dto: CreateBookPurchaseDto,
  ): Promise<PurchaseOperation> {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required.');
    }

    return this.bookPurchaseService.createOperation(idempotencyKey, dto);
  }

  @Get('operations')
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
  @ApiResponse({ status: HttpStatus.OK, type: PurchaseOperation })
  async findOne(
    @Param('operationId') operationId: string,
  ): Promise<PurchaseOperation> {
    return this.bookPurchaseService.findOperation(operationId);
  }

  @Post('operations/:operationId/replay')
  @ApiResponse({ status: HttpStatus.OK, type: PurchaseOperation })
  async replayEvent(
    @Param('operationId') operationId: string,
    @Body() dto: ReplayProviderEventDto,
  ): Promise<PurchaseOperation> {
    return this.bookPurchaseService.replayProviderEvent(operationId, dto.status);
  }
}
