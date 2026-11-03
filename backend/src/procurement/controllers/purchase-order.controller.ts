import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../users/guards/permissions.guard';
import { RequirePermissions } from '../../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PurchaseOrderService } from '../services/purchase-order.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('procurement')
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @RequirePermissions('procurement.view')
  @Get('orders')
  async getAllOrders() {
    return await this.poService.getAllOrders();
  }

  @RequirePermissions('procurement.view')
  @Get('suppliers/master')
  async getMasterSuppliers() {
    return await this.poService.getMasterSuppliers();
  }

  @RequirePermissions('procurement.view')
  @Get('materials/master')
  async getMasterMaterials(@Query('category') category?: string) {
    return await this.poService.getMasterMaterials(category);
  }

  @RequirePermissions('procurement.create')
  @Post('orders')
  async createOrder(@Body() body: any) {
    return await this.poService.createOrder(body);
  }
}