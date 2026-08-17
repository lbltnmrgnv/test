import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CategoryModule } from './category/category.module';
import { BookModule } from './book/book.module';
import { BookPurchaseModule } from './book-purchase/book-purchase.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CategoryModule,
    BookModule,
    AuthModule,
    WalletModule,
    BookPurchaseModule,
    OrderModule,
  ],
})
export class AppModule {}
