import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../users/guards/permissions.guard';
import { RequirePermissions } from '../../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { RequisitionService } from '../services/requisition.service';
import { Requisition } from '../entities/requisition.entity';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('procurement/requisitions')
export class RequisitionController {
  constructor(private readonly requisitionService: RequisitionService) {}

  @RequirePermissions('procurement.view')
  @Get()
  async findAll(): Promise<Requisition[]> {
    return this.requisitionService.findAll();
  }

  @RequirePermissions('procurement.create')
  @Post()
  async create(@Body() dto: any): Promise<Requisition> {
    return this.requisitionService.create(dto);
  }
}