import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateRequisitionStatusDto {
  @IsNotEmpty()
  @IsString()
  status: string; // 'PENDING', 'APPROVED', 'DISPATCHED', 'REJECTED'
}