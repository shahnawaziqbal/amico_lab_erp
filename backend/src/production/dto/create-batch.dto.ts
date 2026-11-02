import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsString()
  @IsOptional()
  productCode?: string;

  @IsString()
  @IsNotEmpty({ message: 'Product name is required for batch creation' })
  productName: string;

  @IsNumber({}, { message: 'Target quantity must be a valid number' })
  @Min(1, { message: 'Target quantity must be at least 1' })
  targetQuantity: number;

  @IsString()
  @IsOptional()
  lineReference?: string;
}