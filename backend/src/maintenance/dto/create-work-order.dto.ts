import { IsString, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { WorkOrderType, WorkOrderPriority } from '../entities/work-order.entity';

export class CreateWorkOrderDto {
  @IsString()
  workOrderNumber: string;

  @IsUUID()
  assetId: string;

  @IsEnum(WorkOrderType)
  type: WorkOrderType;

  @IsEnum(WorkOrderPriority)
  priority: WorkOrderPriority;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  assignedTechnician?: string;
}