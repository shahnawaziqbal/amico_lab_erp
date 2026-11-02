import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FieldOfficer } from './field-officers.entity';

@Injectable()
export class FieldOfficersService {
  constructor(
    @InjectRepository(FieldOfficer)
    private readonly foRepo: Repository<FieldOfficer>,
  ) {}

  async findAll(): Promise<FieldOfficer[]> {
    return this.foRepo.find({
      order: { compositeScore: 'DESC' },
    });
  }

  async findByDepot(depotCode: string): Promise<FieldOfficer[]> {
    return this.foRepo.find({
      where: { depotCode },
      order: { compositeScore: 'DESC' },
    });
  }

  async create(data: any): Promise<FieldOfficer> {
    const newFo = this.foRepo.create({
      teriCode: data.teriCode || `ODK-${Math.floor(100 + Math.random() * 900)}`,
      fullName: data.fullName,
      depotCode: data.depotCode || 'DK',
      depotName: data.depotName || 'Dhaka',
      joinDate: data.joinDate || new Date().toISOString().split('T')[0],
      tenureMonths: parseInt(data.tenureMonths, 10) || 12,
      tenureBand: data.tenureBand || '6-12 Months',
      currentSales: parseFloat(data.currentSales) || 0,
      threeMonthAvg: parseFloat(data.threeMonthAvg) || 0,
      compositeScore: parseFloat(data.compositeScore) || 80.0,
      rank: data.rank || '1',
      tier: data.tier || 'B – Competent',
    });
    return await this.foRepo.save(newFo);
  }
}