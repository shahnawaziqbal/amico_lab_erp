import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { InternalReqService } from '../services/internal-req.service';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly internalReqService: InternalReqService,
  ) {}

  @Get('stocks')
  async getAllStocks() {
    return await this.inventoryService.getAllStocks();
  }

  @Post('receive-qc')
  async receiveStockFromQC(@Body() body: any) {
    return await this.inventoryService.receiveStockFromQC(body);
  }

 @Post('transfer-depot')
async transferToDepot(
  @Body() data: { itemCode: string; batchNumber: string; quantity: number; unit: string; destinationDepot: string; remarks?: string }
) {
  return await this.inventoryService.transferToDepot(data);
}

  @Post('confirm-depot-receipt/:id')
  async confirmDepotReceipt(@Param('id') id: string) {
    return await this.inventoryService.confirmDepotReceipt(id);
  }

  @Get('requisitions')
  async getAllRequisitions() {
    return await this.internalReqService.getAllRequisitions();
  }

  @Post('requisitions')
  async createRequisition(@Body() body: any) {
    return await this.internalReqService.createRequisition(body);
  }

  @Patch('requisitions/:id/status')
  async updateRequisitionStatus(
    @Param('id') id: string, 
    @Body() body: { status: 'APPROVED' | 'DISPATCHED' | 'REJECTED' }
  ) {
    return await this.internalReqService.updateStatus(id, body.status);
  }
}