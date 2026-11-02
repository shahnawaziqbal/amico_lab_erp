import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './crm.entity';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(Customer)
    private crmRepo: Repository<Customer>,
  ) {}

  async findAll(): Promise<Customer[]> {
    return await this.crmRepo.find();
  }

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    const newCustomer = this.crmRepo.create(customerData);
    return await this.crmRepo.save(newCustomer);
  }
}