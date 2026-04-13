import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CategoryModule } from './category/category.module';
import { BookModule } from './book/book.module';
import { BookPurchaseModule } from './book-purchase/book-purchase.module';

@Module({
  imports: [ConfigModule.forRoot(), CategoryModule, BookModule, BookPurchaseModule],
})
export class AppModule {}
