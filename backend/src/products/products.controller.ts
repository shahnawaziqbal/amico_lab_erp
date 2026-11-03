import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequirePermissions } from '../users/guards/require-permissions.decorator';
import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/products')
export class ProductController {
  constructor(private readonly dataSource: DataSource) {}

  @RequirePermissions('sales.view')
  @Get()
  async getProducts() {
    return this.dataSource.query('SELECT * FROM products ORDER BY productCode ASC');
  }
}