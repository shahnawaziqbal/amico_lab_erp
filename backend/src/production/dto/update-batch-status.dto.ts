import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class UpdateBatchStatusDto {
  @IsString()
  @IsNotEmpty({ message: 'Status is required' })
  @IsIn(['SCHEDULED', 'DISPENSED', 'IN_PROGRESS', 'QC_HOLD', 'COMPLETED'], {
    message: 'Status must be one of: SCHEDULED, DISPENSED, IN_PROGRESS, QC_HOLD, COMPLETED',
  })
  status: string;

  @IsString()
  @IsOptional()
  bmrStagesJson?: string;
}