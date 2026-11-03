import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequirePermissions } from '../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // --- ASSET ROUTES ---

  @RequirePermissions('maintenance.create')
  @Post('assets')
  async createAsset(@Body() dto: CreateAssetDto) {
    return this.maintenanceService.createAsset(dto);
  }

  @RequirePermissions('maintenance.view')
  @Get('assets')
  async getAllAssets(
    @Query('building') building?: string,
    @Query('criticality') criticality?: string,
  ) {
    return this.maintenanceService.getAllAssets(building, criticality);
  }

  @RequirePermissions('maintenance.view')
  @Get('assets/:id')
  async getAssetById(@Param('id') id: string) {
    return this.maintenanceService.getAssetById(id);
  }

  // --- WORK ORDER ROUTES ---

  @RequirePermissions('maintenance.create')
  @Post('work-orders')
  async createWorkOrder(@Body() dto: CreateWorkOrderDto) {
    return this.maintenanceService.createWorkOrder(dto);
  }

  @RequirePermissions('maintenance.view')
  @Get('work-orders')
  async getAllWorkOrders(@Query('status') status?: string) {
    return this.maintenanceService.getAllWorkOrders(status);
  }

  @RequirePermissions('maintenance.approve')
  @Post('work-orders/:id/close')
  async closeWorkOrder(
    @Param('id') id: string,
    @Body('rootCauseAnalysis') rootCauseAnalysis: string,
    @Body('assignedTechnician') assignedTechnician?: string,
  ) {
    return this.maintenanceService.updateWorkOrderCloseout(id, rootCauseAnalysis, assignedTechnician);
  }
}