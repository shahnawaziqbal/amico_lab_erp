import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class OverheadInputDto {
  @IsString()
  costCenterId: string;

  @IsString()
  period: string; // Format: YYYY-MM

  @IsNumber()
  @Min(0)
  @IsOptional()
  employeeSalary?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  laborSalary?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  utilities?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  capex?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  opex?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}