import { IsNotEmpty, IsString, IsArray, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RequisitionItemDto {
  @IsOptional()
  @IsString()
  materialCode?: string;

  @IsNotEmpty()
  @IsString()
  materialName: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  requestedQty: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateRequisitionDto {
  @IsNotEmpty()
  @IsString()
  locationType: string;

  @IsNotEmpty()
  @IsString()
  department: string;

  @IsNotEmpty()
  @IsString()
  requestDate: string;

  @IsOptional()
  @IsString()
  purposeRemarks?: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequisitionItemDto)
  items: RequisitionItemDto[];
}