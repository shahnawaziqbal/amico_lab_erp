import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../users/guards/permissions.guard';
import { RequirePermissions } from '../../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierQuotation } from '../entities/supplier-quotation.entity';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('procurement/supplier-quotations')
export class SupplierQuotationController {
  constructor(
    @InjectRepository(SupplierQuotation)
    private readonly quoteRepo: Repository<SupplierQuotation>,
  ) {}

  @RequirePermissions('procurement.view')
  @Get()
  async findAll(): Promise<SupplierQuotation[]> {
    return this.quoteRepo.find({ order: { createdAt: 'DESC' } });
  }

  @RequirePermissions('procurement.create')
  @Post()
  async create(@Body() dto: any): Promise<SupplierQuotation> {
    const quote = this.quoteRepo.create(dto);
    return (await this.quoteRepo.save(quote)) as unknown as SupplierQuotation;
  }
}