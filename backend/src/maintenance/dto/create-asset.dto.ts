import { IsString, IsEnum, IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { AssetCriticality, AssetStatus } from '../entities/asset.entity';

export class CreateAssetDto {
  @IsString()
  assetTag: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  countryOfOrigin?: string;

  @IsString()
  building: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  roomLocation: string;

  @IsEnum(AssetCriticality)
  criticality: AssetCriticality;

  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @IsBoolean()
  requiresCalibration: boolean;

  @IsDateString()
  @IsOptional()
  nextCalibrationDueDate?: string;
}