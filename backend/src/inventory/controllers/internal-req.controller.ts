import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../users/guards/permissions.guard';
import { RequirePermissions } from '../../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { InternalReqService } from '../services/internal-req.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory/requisitions')
export class InternalReqController {
  constructor(private readonly internalReqService: InternalReqService) {}

  // 1. Fetch All Internal Requisitions
  @RequirePermissions('inventory.view')
  @Get()
  async getAllRequisitions() {
    return await this.internalReqService.getAllRequisitions();
  }

  // 2. Fetch Single Requisition by ID or Requisition Number
  @RequirePermissions('inventory.view')
  @Get(':id')
  async getRequisitionById(@Param('id') id: string) {
    return await this.internalReqService.getRequisitionById(id);
  }

  // 3. Create New Multi-Department Requisition (Factory, Head Office, Depots)
  @RequirePermissions('inventory.create')
  @Post()
  async createRequisition(@Body() body: any) {
    return await this.internalReqService.createRequisition(body);
  }

  // 4. Update Requisition Status (Approve, Dispatch, or Reject)
  @RequirePermissions('inventory.approve')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'DISPATCHED' | 'REJECTED',
  ) {
    return await this.internalReqService.updateStatus(id, status);
  }
}