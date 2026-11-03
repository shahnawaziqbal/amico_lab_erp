import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../users/guards/permissions.guard';
import { RequirePermissions } from '../../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { InternalReqService } from '../services/internal-req.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly internalReqService: InternalReqService,
  ) {}

  @RequirePermissions('inventory.view')
  @Get('stocks')
  async getAllStocks() {
    return await this.inventoryService.getAllStocks();
  }

  @RequirePermissions('inventory.approve')
  @Post('receive-qc')
  async receiveStockFromQC(@Body() body: any) {
    return await this.inventoryService.receiveStockFromQC(body);
  }

 @RequirePermissions('inventory.update')
 @Post('transfer-depot')
async transferToDepot(
  @Body() data: { itemCode: string; batchNumber: string; quantity: number; unit: string; destinationDepot: string; remarks?: string }
) {
  return await this.inventoryService.transferToDepot(data);
}

  @RequirePermissions('inventory.approve')
  @Post('confirm-depot-receipt/:id')
  async confirmDepotReceipt(@Param('id') id: string) {
    return await this.inventoryService.confirmDepotReceipt(id);
  }



}