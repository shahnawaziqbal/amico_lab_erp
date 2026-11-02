import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('api/products')
export class ProductController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async getProducts() {
    return this.dataSource.query('SELECT * FROM products ORDER BY productCode ASC');
  }
}