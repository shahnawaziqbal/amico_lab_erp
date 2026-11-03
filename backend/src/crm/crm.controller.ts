import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequirePermissions } from '../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { CrmService } from './crm.service';
import { Customer } from './crm.entity';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @RequirePermissions('crm.view')
  @Get()
  async getAllCustomers(): Promise<Customer[]> {
    return await this.crmService.findAll();
  }

  @RequirePermissions('crm.create')
  @Post()
  async createCustomer(@Body() customerData: Partial<Customer>): Promise<Customer> {
    return await this.crmService.createCustomer(customerData);
  }
}