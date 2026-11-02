import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, AssetStatus } from './entities/asset.entity';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {}

  // --- ASSET MANAGEMENT METHODS ---

  async createAsset(dto: CreateAssetDto): Promise<Asset> {
    try {
      const existing = await this.assetRepository.findOne({ where: { assetTag: dto.assetTag } });
      if (existing) {
        throw new ConflictException(`Asset tag "${dto.assetTag}" already exists.`);
      }
      const asset = this.assetRepository.create(dto);
      return await this.assetRepository.save(asset);
    } catch (error: unknown) {
      console.error('--- ASSET CREATION ERROR ---', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      // Safely extract message from unknown error type
      const errorMessage = error instanceof Error ? error.message : 'Failed to create asset in database.';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async getAllAssets(building?: string, criticality?: string): Promise<Asset[]> {
    const query = this.assetRepository.createQueryBuilder('asset');
    if (building) {
      query.andWhere('asset.building = :building', { building });
    }
    if (criticality) {
      query.andWhere('asset.criticality = :criticality', { criticality });
    }
    return await query.getMany();
  }

  async getAssetById(id: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { id },
      relations: {
        workOrders: true,
        calibrationLogs: true,
      },
    });
    if (!asset) {
      throw new NotFoundException(`Asset ID ${id} not found.`);
    }
    return asset;
  }

  // --- WORK ORDER & BREAKDOWN METHODS ---

  async createWorkOrder(dto: CreateWorkOrderDto): Promise<WorkOrder> {
    const asset = await this.assetRepository.findOne({ where: { id: dto.assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${dto.assetId} not found.`);
    }

    const workOrderRepository = this.assetRepository.manager.getRepository(WorkOrder);
    
    if (dto.type === 'BREAKDOWN') {
      asset.status = AssetStatus.UNDER_REPAIR;
      await this.assetRepository.save(asset);
    }

    const workOrder = workOrderRepository.create(dto);
    return await workOrderRepository.save(workOrder);
  }

  async getAllWorkOrders(status?: string): Promise<WorkOrder[]> {
    const workOrderRepository = this.assetRepository.manager.getRepository(WorkOrder);
    const query = workOrderRepository.createQueryBuilder('wo').leftJoinAndSelect('wo.asset', 'asset');
    
    if (status) {
      query.andWhere('wo.status = :status', { status });
    }
    
    return await query.getMany();
  }

  async updateWorkOrderCloseout(
    id: string,
    rootCauseAnalysis: string,
    assignedTechnician?: string,
  ): Promise<WorkOrder> {
    const workOrderRepository = this.assetRepository.manager.getRepository(WorkOrder);
    const workOrder = await workOrderRepository.findOne({ 
      where: { id }, 
      relations: { asset: true } 
    });
    
    if (!workOrder) {
      throw new NotFoundException(`Work Order ID ${id} not found.`);
    }

    workOrder.rootCauseAnalysis = rootCauseAnalysis;
    workOrder.status = WorkOrderStatus.COMPLETED;
    workOrder.completedAt = new Date();
    
    if (assignedTechnician) {
      workOrder.assignedTechnician = assignedTechnician;
    }

    if (workOrder.asset) {
      workOrder.asset.status = AssetStatus.OPERATIONAL;
      await this.assetRepository.save(workOrder.asset);
    }

    return await workOrderRepository.save(workOrder);
  }
}