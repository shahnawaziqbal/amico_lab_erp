import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBomDto {
  @IsString()
  @IsOptional()
  productCode?: string;

  @IsString()
  @IsNotEmpty({ message: 'Product name is required for BOM recipe creation' })
  productName: string;

  @IsString()
  @IsOptional()
  batchSize?: string;

  @IsString()
  @IsOptional()
  dosageForm?: string;

  @IsNotEmpty({ message: 'Ingredients formulation data is required' })
  ingredientsJson: any; // Accepts either an array of objects or a serialized JSON string
}