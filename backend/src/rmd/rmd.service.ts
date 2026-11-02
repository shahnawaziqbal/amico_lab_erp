import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RmdProject } from './rmd.entity';

@Injectable()
export class RmdService {
  constructor(
    @InjectRepository(RmdProject)
    private rmdRepo: Repository<RmdProject>,
  ) {}

  async findAll(): Promise<RmdProject[]> {
    return await this.rmdRepo.find();
  }

  async createProject(projectData: Partial<RmdProject>): Promise<RmdProject> {
    const newProject = this.rmdRepo.create(projectData);
    return await this.rmdRepo.save(newProject);
  }
}