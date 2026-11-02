import { Controller, Get, Post, Body } from '@nestjs/common';
import { RequisitionService } from '../services/requisition.service';
import { Requisition } from '../entities/requisition.entity';

@Controller('procurement/requisitions')
export class RequisitionController {
  constructor(private readonly requisitionService: RequisitionService) {}

  @Get()
  async findAll(): Promise<Requisition[]> {
    return this.requisitionService.findAll();
  }

  @Post()
  async create(@Body() dto: any): Promise<Requisition> {
    return this.requisitionService.create(dto);
  }
}