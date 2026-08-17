import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
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
import { TopUpWalletDto } from './dto/top-up-wallet.dto';
import { WalletService } from './wallet.service';
import { WalletBalance } from './models/wallet-balance.model';
import { WalletTransaction } from './models/wallet-transaction.model';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user wallet balance' })
  @ApiResponse({ status: HttpStatus.OK, type: WalletBalance })
  async getBalance(@Req() request: AuthenticatedRequest): Promise<WalletBalance> {
    return {
      balanceCents: await this.walletService.getBalance(request.user.id),
    };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiResponse({ status: HttpStatus.OK, type: WalletTransaction, isArray: true })
  async getTransactions(
    @Req() request: AuthenticatedRequest,
  ): Promise<WalletTransaction[]> {
    return this.walletService.getTransactions(request.user.id);
  }

  @Post('top-up')
  @ApiOperation({ summary: 'Top up wallet balance' })
  @ApiResponse({ status: HttpStatus.CREATED, type: WalletBalance })
  async topUp(
    @Req() request: AuthenticatedRequest,
    @Body() dto: TopUpWalletDto,
  ): Promise<WalletBalance> {
    return {
      balanceCents: await this.walletService.topUp(
        request.user.id,
        dto.amountCents,
        dto.description,
      ),
    };
  }
}
