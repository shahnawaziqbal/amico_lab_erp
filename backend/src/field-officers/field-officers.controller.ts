import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequirePermissions } from '../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { DataSource } from 'typeorm';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/field-officers')
export class FieldOfficersController {
  constructor(private readonly dataSource: DataSource) {}

  @RequirePermissions('sales.view')
  @Get()
  async getFieldOfficers() {
    // Query direct SQLite table to bypass entity mapping discrepancies
    return this.dataSource.query('SELECT * FROM field_officers ORDER BY teriCode ASC');
  }

}