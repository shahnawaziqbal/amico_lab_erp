import { IsString, IsBoolean, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateCalibrationLogDto {
  @IsUUID()
  assetId: string;

  @IsString()
  certificateNumber: string; // e.g., 'CAL-2026-0806'

  @IsDateString()
  calibrationDate: string; // e.g., '2026-08-06'

  @IsDateString()
  nextDueDate: string; // e.g., '2027-08-06'

  @IsString()
  performedBy: string; // Certified Agency / Technician Name

  @IsBoolean()
  @IsOptional()
  isPassed?: boolean;

  @IsString()
  @IsOptional()
  remarks?: string;
}