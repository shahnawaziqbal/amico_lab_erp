import { IsString, IsEnum, IsOptional } from 'class-validator';

export class QcInspectionDto {
  @IsString()
  itemId: string;

  @IsEnum(['PASSED', 'FAILED_RETURNED'])
  qcStatus: string; // 'PASSED' (Generates GRN for Production) or 'FAILED_RETURNED' (Vendor Return)

  @IsString()
  @IsOptional()
  remarks: string;

  @IsString()
  @IsOptional()
  inspectorName: string; // e.g., QA Pharmacist Dr. Farhana Yasmin
}