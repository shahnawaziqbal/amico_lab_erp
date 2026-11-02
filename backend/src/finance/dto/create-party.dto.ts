import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsOptional, 
  IsNumber, 
  Min, 
  IsEmail 
} from 'class-validator';

export enum PartyType {
  CLIENT = 'CLIENT',
  VENDOR = 'VENDOR',
  BOTH = 'BOTH',
}

export enum PartyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreatePartyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PartyType)
  @IsNotEmpty()
  type: PartyType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  openingBalance?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  creditLimit?: number;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(PartyStatus)
  @IsOptional()
  status?: PartyStatus;
}