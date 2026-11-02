import { Controller, Get, Post, Body } from '@nestjs/common';
import { QcQuarantineService } from '../services/qc-quarantine.service';
import { QuarantineItem } from '../entities/quarantine-item.entity';

@Controller('procurement')
export class QcQuarantineController {
  constructor(private readonly qcService: QcQuarantineService) {}

  @Get('quarantine')
  async findAllQuarantine(): Promise<QuarantineItem[]> {
    return this.qcService.findAllQuarantine();
  }

  @Post('qc-inspect')
  async inspectItem(
    @Body() dto: { itemId: string; qcStatus: string; remarks: string },
  ) {
    return this.qcService.updateQcStatus(dto.itemId, dto.qcStatus, dto.remarks);
  }
}