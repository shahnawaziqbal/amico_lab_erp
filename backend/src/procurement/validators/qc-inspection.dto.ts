import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePoItemDto {
  @IsString()
  materialCategory: string; // 'RAW_MATERIAL' or 'PACKAGING_MATERIAL'

  @IsString()
  materialSubtype: string; // 'API', 'EXCIPIENT', 'ALUMINIUM_FOIL', 'PLASTIC_BOTTLE', 'GLASS_BOTTLE', 'BOTTLE_HEAD', 'CARTON'

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
  vendorType: string; // 'LOCAL' or 'IMPORT'

  @IsString()
  orderDate: string;

  @IsString()
  expectedDeliveryDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoItemDto)
  items: CreatePoItemDto[];
}