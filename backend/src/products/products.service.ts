import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './products.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepo.find({ order: { productName: 'ASC' } });
  }

  async create(data: any): Promise<Product> {
    const newProd = this.productRepo.create({
      productCode: data.productCode || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      productName: data.productName,
      unit: data.unit || 'Tablets',
      notes: data.notes || '',
    });
    return await this.productRepo.save(newProd);
  }
}