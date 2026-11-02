import { Controller, Get, Post, Body } from '@nestjs/common';
import { CrmService } from './crm.service';
import { Customer } from './crm.entity';

@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get()
  async getAllCustomers(): Promise<Customer[]> {
    return await this.crmService.findAll();
  }

  @Post()
  async createCustomer(@Body() customerData: Partial<Customer>): Promise<Customer> {
    return await this.crmService.createCustomer(customerData);
  }
}