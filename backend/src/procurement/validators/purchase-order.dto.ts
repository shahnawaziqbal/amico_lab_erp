import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePoItemDto {
  @IsString()
  materialCategory: string;

  @IsString()
  materialSubtype: string;

  @IsString()
  itemName: string;

  @IsNumber()
  quantity: number;

  @IsString()
  unit: string;

  @IsNumber()
  unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  poNumber: string;

  @IsString()
  vendorName: string;

  @IsString()
  vendorType: string;

  @IsString()
  orderDate: string;

  @IsString()
  expectedDeliveryDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoItemDto)
  items: CreatePoItemDto[];
}