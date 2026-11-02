import { Controller, Get, Post, Body } from '@nestjs/common';
import { RfqService } from '../services/rfq.service';
import { Rfq } from '../entities/rfq.entity';

@Controller('procurement/rfq')
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Get()
  async findAll(): Promise<Rfq[]> {
    return this.rfqService.findAll();
  }

  @Post()
  async create(@Body() dto: any): Promise<Rfq> {
    return this.rfqService.create(dto);
  }
}