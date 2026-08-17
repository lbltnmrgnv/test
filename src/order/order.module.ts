import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BookModule } from '../book/book.module';
import { BookPurchaseModule } from '../book-purchase/book-purchase.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [AuthModule, BookModule, BookPurchaseModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
