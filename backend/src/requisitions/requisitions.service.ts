import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requisition } from './entities/requisition.entity';
import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { UpdateRequisitionStatusDto } from './dto/update-requisition-status.dto';

@Injectable()
export class RequisitionsService {
  constructor(
    @InjectRepository(Requisition)
    private readonly requisitionRepository: Repository<Requisition>,
  ) {}

  async findAll(): Promise<any[]> {
    const reqs = await this.requisitionRepository.find({
      order: { createdAt: 'DESC' },
    });
    return reqs.map((r) => ({
      ...r,
      items: JSON.parse(r.items || '[]'),
    }));
  }

  async findOne(id: number): Promise<any> {
    const req = await this.requisitionRepository.findOne({ where: { id } });
    if (!req) {
      throw new NotFoundException(`Requisition with ID ${id} not found`);
    }
    return {
      ...req,
      items: JSON.parse(req.items || '[]'),
    };
  }

  async create(createDto: CreateRequisitionDto): Promise<any> {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const reqNumber = `REQ-${new Date().getFullYear()}-${randomNum}`;

    const newReq = this.requisitionRepository.create({
      reqNumber,
      locationType: createDto.locationType,
      department: createDto.department,
      requestDate: createDto.requestDate,
      purposeRemarks: createDto.purposeRemarks || '',
      items: JSON.stringify(createDto.items || []),
      status: 'PENDING',
    });

    const saved = await this.requisitionRepository.save(newReq);
    return {
      ...saved,
      items: JSON.parse(saved.items),
    };
  }

  async updateStatus(id: number, updateDto: UpdateRequisitionStatusDto): Promise<any> {
    const req = await this.requisitionRepository.findOne({ where: { id } });
    if (!req) {
      throw new NotFoundException(`Requisition with ID ${id} not found`);
    }

    req.status = updateDto.status;
    const updated = await this.requisitionRepository.save(req);
    return {
      ...updated,
      items: JSON.parse(updated.items || '[]'),
    };
  }

  async remove(id: number): Promise<void> {
    const result = await this.requisitionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Requisition with ID ${id} not found`);
    }
  }
}