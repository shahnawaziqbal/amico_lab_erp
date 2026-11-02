import { 
  IsString, 
  IsNotEmpty, 
  IsDateString, 
  IsOptional, 
  IsArray, 
  ValidateNested, 
  IsNumber, 
  Min 
} from 'class-validator';
import { Type } from 'class-transformer';

export class JournalEntryLineDto {
  @IsString()
  @IsOptional()
  itemName?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsOptional()
  partyId?: string;

  @IsString()
  @IsOptional()
  costCenterId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  debit: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  credit: number;
}

export class CreateJournalEntryDto {
  @IsString()
  @IsNotEmpty()
  entryNumber: string;

  @IsString()
  @IsOptional()
  entryType?: string; // 'PAYABLE' or 'RECEIVABLE'

  @IsString()
  @IsOptional()
  paymentCategory?: string; // 'CASH', 'BANK_CHEQUE', 'ONLINE_TRANSFER'

  @IsString()
  @IsOptional()
  partyId?: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  vatAmount?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  aitAmount?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  outstandingAmount?: number; // Outstanding amount tracked for this voucher

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  settledAmount?: number; // Amount paid/received against outstanding

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  @IsNotEmpty()
  lines: JournalEntryLineDto[];
}