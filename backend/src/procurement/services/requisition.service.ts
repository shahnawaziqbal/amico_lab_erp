import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requisition } from '../entities/requisition.entity';

@Injectable()
export class RequisitionService {
  constructor(
    @InjectRepository(Requisition)
    private readonly reqRepo: Repository<Requisition>,
  ) {}

  async findAll(): Promise<Requisition[]> {
    return this.reqRepo.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: any): Promise<Requisition> {
    const req = this.reqRepo.create(dto);
    return (await this.reqRepo.save(req)) as unknown as Requisition;
  }
}