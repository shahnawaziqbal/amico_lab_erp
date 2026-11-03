import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../users/guards/permissions.guard';
import { RequirePermissions } from '../../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { QcQuarantineService } from '../services/qc-quarantine.service';
import { QuarantineItem } from '../entities/quarantine-item.entity';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('procurement')
export class QcQuarantineController {
  constructor(private readonly qcService: QcQuarantineService) {}

  @RequirePermissions('quality.view')
  @Get('quarantine')
  async findAllQuarantine(): Promise<QuarantineItem[]> {
    return this.qcService.findAllQuarantine();
  }

  @RequirePermissions('quality.approve')
  @Post('qc-inspect')
  async inspectItem(
    @Body() dto: { itemId: string; qcStatus: string; remarks: string },
  ) {
    return this.qcService.updateQcStatus(dto.itemId, dto.qcStatus, dto.remarks);
  }
}