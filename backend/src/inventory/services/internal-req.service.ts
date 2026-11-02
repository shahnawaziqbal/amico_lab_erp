import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternalRequisition } from '../entities/internal-requisition.entity';

@Injectable()
export class InternalReqService {
  constructor(
    @InjectRepository(InternalRequisition)
    private readonly reqRepository: Repository<InternalRequisition>,
  ) {}

  // 1. Fetch All Internal Requisitions
  async getAllRequisitions(): Promise<InternalRequisition[]> {
    return await this.reqRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // 2. Fetch Single Requisition by ID or Requisition Number
  async getRequisitionById(id: string): Promise<InternalRequisition> {
    const req = await this.reqRepository.findOne({ where: [{ id }, { requisitionNumber: id }] });
    if (!req) {
      throw new NotFoundException(`Internal Requisition ${id} not found.`);
    }
    return req;
  }

  // 3. Create New Internal Requisition (Multi-Department: Factory, Head Office, Depots)
  async createRequisition(data: any): Promise<InternalRequisition> {
    const req = new InternalRequisition();
    
    // Auto-generate system requisition number
    const dateYear = new Date().getFullYear();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    req.requisitionNumber = data.requisitionNumber || `REQ-${dateYear}-${randomCode}`;

    req.requestingDepartment = data.requestingDepartment || 'FACTORY_PRODUCTION';
    req.status = 'PENDING';
    req.requestDate = data.requestDate || new Date().toISOString().split('T')[0];
    req.purposeRemarks = data.purposeRemarks || 'Official Departmental Requisition for Plant/Office operations.';

    req.items = (data.items || []).map((item: any) => ({
      itemCode: item.itemCode || `ITEM-${Math.floor(100 + Math.random() * 900)}`,
      itemName: item.itemName,
      requestedQty: parseFloat(item.requestedQty) || 0,
      unit: item.unit || 'pcs',
      category: item.category || 'GENERAL_SUPPLIES',
    }));

    return await this.reqRepository.save(req);
  }

  // 4. Update Requisition Status (APPROVE / DISPATCH / REJECT)
  async updateStatus(id: string, status: 'APPROVED' | 'DISPATCHED' | 'REJECTED'): Promise<InternalRequisition> {
    const req = await this.getRequisitionById(id);
    req.status = status;
    return await this.reqRepository.save(req);
  }
}