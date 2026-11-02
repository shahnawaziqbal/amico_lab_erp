import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // --- ASSET ROUTES ---

  @Post('assets')
  async createAsset(@Body() dto: CreateAssetDto) {
    return this.maintenanceService.createAsset(dto);
  }

  @Get('assets')
  async getAllAssets(
    @Query('building') building?: string,
    @Query('criticality') criticality?: string,
  ) {
    return this.maintenanceService.getAllAssets(building, criticality);
  }

  @Get('assets/:id')
  async getAssetById(@Param('id') id: string) {
    return this.maintenanceService.getAssetById(id);
  }

  // --- WORK ORDER ROUTES ---

  @Post('work-orders')
  async createWorkOrder(@Body() dto: CreateWorkOrderDto) {
    return this.maintenanceService.createWorkOrder(dto);
  }

  @Get('work-orders')
  async getAllWorkOrders(@Query('status') status?: string) {
    return this.maintenanceService.getAllWorkOrders(status);
  }

  @Post('work-orders/:id/close')
  async closeWorkOrder(
    @Param('id') id: string,
    @Body('rootCauseAnalysis') rootCauseAnalysis: string,
    @Body('assignedTechnician') assignedTechnician?: string,
  ) {
    return this.maintenanceService.updateWorkOrderCloseout(id, rootCauseAnalysis, assignedTechnician);
  }
}