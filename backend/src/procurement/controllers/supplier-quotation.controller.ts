import { Controller, Get, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierQuotation } from '../entities/supplier-quotation.entity';

@Controller('procurement/supplier-quotations')
export class SupplierQuotationController {
  constructor(
    @InjectRepository(SupplierQuotation)
    private readonly quoteRepo: Repository<SupplierQuotation>,
  ) {}

  @Get()
  async findAll(): Promise<SupplierQuotation[]> {
    return this.quoteRepo.find({ order: { createdAt: 'DESC' } });
  }

  @Post()
  async create(@Body() dto: any): Promise<SupplierQuotation> {
    const quote = this.quoteRepo.create(dto);
    return (await this.quoteRepo.save(quote)) as unknown as SupplierQuotation;
  }
}