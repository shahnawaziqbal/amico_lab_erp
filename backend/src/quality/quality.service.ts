// backend/src/quality/quality.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { QualityInspection } from './quality.entity';

@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(QualityInspection)
    private readonly qualityRepo: Repository<QualityInspection>,
  ) {}

  async findAll(startDate?: string, endDate?: string): Promise<QualityInspection[]> {
    if (startDate && endDate) {
      return this.qualityRepo.find({
        where: {
          inspectionDate: Between(new Date(startDate), new Date(endDate)),
        },
        order: { inspectionDate: 'DESC' },
      });
    }
    return this.qualityRepo.find({ order: { inspectionDate: 'DESC' } });
  }

  async create(data: Partial<QualityInspection>): Promise<QualityInspection> {
    const auditId = `QA-AUD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newInspection = this.qualityRepo.create({ ...data, auditId });
    return this.qualityRepo.save(newInspection);
  }
}