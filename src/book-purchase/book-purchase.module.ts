import { Module } from '@nestjs/common';
import { BookModule } from '../book/book.module';
import { BookPurchaseController } from './book-purchase.controller';
import { BookPurchaseService } from './book-purchase.service';

@Module({
  imports: [BookModule],
  controllers: [BookPurchaseController],
  providers: [BookPurchaseService],
})
export class BookPurchaseModule {}
