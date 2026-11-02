import { Controller, Get, Post, Body } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('api/field-officers')
export class FieldOfficersController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async getFieldOfficers() {
    // Query direct SQLite table to bypass entity mapping discrepancies
    return this.dataSource.query('SELECT * FROM field_officers ORDER BY teriCode ASC');
  }

  @Post()
  async createFieldOfficer(@Body() dto: any) {
    const id = crypto.randomUUID();
    await this.dataSource.query(
      `INSERT INTO field_officers (id, teriCode, fullName, depotCode, depotName, joinDate, tenureMonths, tenureBand, tier, threeMonthAvg, compositeScore) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dto.teriCode,
        dto.fullName,
        dto.depotCode,
        dto.depotName,
        dto.joinDate || '2026-01-15',
        dto.tenureMonths || 12,
        dto.tenureBand || '6-12 Months',
        dto.tier || 'B – Competent',
        dto.threeMonthAvg || 65000,
        dto.compositeScore || 85.0,
      ]
    );
    return { success: true, id };
  }
}