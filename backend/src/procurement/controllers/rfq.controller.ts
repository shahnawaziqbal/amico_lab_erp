import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../users/guards/permissions.guard';
import { RequirePermissions } from '../../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { RfqService } from '../services/rfq.service';
import { Rfq } from '../entities/rfq.entity';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('procurement/rfq')
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @RequirePermissions('procurement.view')
  @Get()
  async findAll(): Promise<Rfq[]> {
    return this.rfqService.findAll();
  }

  @RequirePermissions('procurement.create')
  @Post()
  async create(@Body() dto: any): Promise<Rfq> {
    return this.rfqService.create(dto);
  }
}