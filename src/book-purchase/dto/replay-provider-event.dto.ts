import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PurchaseStatus } from '../models/purchase-operation.model';

export class ReplayProviderEventDto {
  @ApiProperty({ enum: [PurchaseStatus.PAID, PurchaseStatus.FAILED] })
  @IsEnum([PurchaseStatus.PAID, PurchaseStatus.FAILED])
  status: PurchaseStatus;
}
