import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { Order } from './models/order.model';
import { OrderService } from './order.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user order history' })
  @ApiResponse({ status: HttpStatus.OK, type: Order, isArray: true })
  async getOrders(@Req() request: AuthenticatedRequest): Promise<Order[]> {
    return this.orderService.getOrders(request.user.id);
  }

  @Get(':operationId')
  @ApiOperation({ summary: 'Get current user order by operation id' })
  @ApiResponse({ status: HttpStatus.OK, type: Order })
  async getOrder(
    @Req() request: AuthenticatedRequest,
    @Param('operationId') operationId: string,
  ): Promise<Order> {
    return this.orderService.getOrder(request.user.id, operationId);
  }
}
