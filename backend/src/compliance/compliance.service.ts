import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceRecord } from './compliance.entity';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(ComplianceRecord)
    private complianceRepo: Repository<ComplianceRecord>,
  ) {}

  async findAll(): Promise<ComplianceRecord[]> {
    return await this.complianceRepo.find();
  }

  async createRecord(recordData: Partial<ComplianceRecord>): Promise<ComplianceRecord> {
    const newRecord = this.complianceRepo.create(recordData);
    return await this.complianceRepo.save(newRecord);
  }
}