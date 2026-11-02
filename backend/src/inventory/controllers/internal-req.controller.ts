import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { InternalReqService } from '../services/internal-req.service';

@Controller('inventory/requisitions')
export class InternalReqController {
  constructor(private readonly internalReqService: InternalReqService) {}

  // 1. Fetch All Internal Requisitions
  @Get()
  async getAllRequisitions() {
    return await this.internalReqService.getAllRequisitions();
  }

  // 2. Fetch Single Requisition by ID or Requisition Number
  @Get(':id')
  async getRequisitionById(@Param('id') id: string) {
    return await this.internalReqService.getRequisitionById(id);
  }

  // 3. Create New Multi-Department Requisition (Factory, Head Office, Depots)
  @Post()
  async createRequisition(@Body() body: any) {
    return await this.internalReqService.createRequisition(body);
  }

  // 4. Update Requisition Status (Approve, Dispatch, or Reject)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'DISPATCHED' | 'REJECTED',
  ) {
    return await this.internalReqService.updateStatus(id, status);
  }
}