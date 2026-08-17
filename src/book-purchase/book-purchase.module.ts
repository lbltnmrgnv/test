import { Module } from '@nestjs/common';
import { BookModule } from '../book/book.module';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';
import { BookPurchaseController } from './book-purchase.controller';
import { BookPurchaseService } from './book-purchase.service';

@Module({
  imports: [BookModule, AuthModule, WalletModule],
  controllers: [BookPurchaseController],
  providers: [BookPurchaseService],
  exports: [BookPurchaseService],
})
export class BookPurchaseModule {}
