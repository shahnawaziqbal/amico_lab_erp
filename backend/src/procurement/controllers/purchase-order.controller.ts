import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PurchaseOrderService } from '../services/purchase-order.service';

@Controller('procurement')
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Get('orders')
  async getAllOrders() {
    return await this.poService.getAllOrders();
  }

  @Get('suppliers/master')
  async getMasterSuppliers() {
    return await this.poService.getMasterSuppliers();
  }

  @Get('materials/master')
  async getMasterMaterials(@Query('category') category?: string) {
    return await this.poService.getMasterMaterials(category);
  }

  @Post('orders')
  async createOrder(@Body() body: any) {
    return await this.poService.createOrder(body);
  }
}