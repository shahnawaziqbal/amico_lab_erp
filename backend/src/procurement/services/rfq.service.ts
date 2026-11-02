import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rfq } from '../entities/rfq.entity';

@Injectable()
export class RfqService {
  constructor(
    @InjectRepository(Rfq)
    private readonly rfqRepo: Repository<Rfq>,
  ) {}

  async findAll(): Promise<Rfq[]> {
    return this.rfqRepo.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: any): Promise<Rfq> {
    const rfq = this.rfqRepo.create(dto);
    return (await this.rfqRepo.save(rfq)) as unknown as Rfq;
  }
}