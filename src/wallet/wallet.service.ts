import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ensureJsonFile } from '../common/utils/file-storage';
import { UserService } from '../user/user.service';
import { WalletTransaction, WalletTransactionType } from './models/wallet-transaction.model';

@Injectable()
export class WalletService {
  private readonly filePath = join(
    process.cwd(),
    'src',
    'data',
    'wallet-transactions.json',
  );

  constructor(private readonly userService: UserService) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.userService.findById(userId);
    return user.walletBalanceCents;
  }

  async topUp(
    userId: string,
    amountCents: number,
    description?: string,
  ): Promise<number> {
    const user = await this.userService.findById(userId);
    const newBalance = user.walletBalanceCents + amountCents;

    await this.userService.update(userId, {
      walletBalanceCents: newBalance,
    });

    await this.addTransaction({
      id: uuidv4(),
      userId,
      type: WalletTransactionType.TOP_UP,
      amountCents,
      balanceAfterCents: newBalance,
      description: description ?? 'Wallet top up',
      createdAt: new Date().toISOString(),
    });

    return newBalance;
  }

  async reserveForPurchase(
    userId: string,
    amountCents: number,
    operationId: string,
  ): Promise<number> {
    const user = await this.userService.findById(userId);

    if (user.walletBalanceCents < amountCents) {
      throw new BadRequestException('Insufficient wallet balance.');
    }

    const newBalance = user.walletBalanceCents - amountCents;

    await this.userService.update(userId, {
      walletBalanceCents: newBalance,
    });

    await this.addTransaction({
      id: uuidv4(),
      userId,
      type: WalletTransactionType.PURCHASE_RESERVE,
      amountCents,
      balanceAfterCents: newBalance,
      description: `Reserved for purchase ${operationId}`,
      createdAt: new Date().toISOString(),
    });

    return newBalance;
  }

  async refundPurchase(
    userId: string,
    amountCents: number,
    operationId: string,
  ): Promise<number> {
    const user = await this.userService.findById(userId);
    const newBalance = user.walletBalanceCents + amountCents;

    await this.userService.update(userId, {
      walletBalanceCents: newBalance,
    });

    await this.addTransaction({
      id: uuidv4(),
      userId,
      type: WalletTransactionType.PURCHASE_REFUND,
      amountCents,
      balanceAfterCents: newBalance,
      description: `Refund for purchase ${operationId}`,
      createdAt: new Date().toISOString(),
    });

    return newBalance;
  }

  async getTransactions(userId: string): Promise<WalletTransaction[]> {
    const transactions = await this.readTransactions();
    return transactions
      .filter(item => item.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  private async addTransaction(transaction: WalletTransaction): Promise<void> {
    const transactions = await this.readTransactions();
    transactions.push(transaction);
    await fs.writeFile(this.filePath, JSON.stringify(transactions, null, 2));
  }

  private async readTransactions(): Promise<WalletTransaction[]> {
    await ensureJsonFile(this.filePath, []);

    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(raw) as WalletTransaction[];
    } catch {
      return [];
    }
  }
}
