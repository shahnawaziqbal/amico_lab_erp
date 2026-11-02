import { Controller, Get, Post, Body } from '@nestjs/common';
import { RmdService } from './rmd.service';
import { RmdProject } from './rmd.entity';

@Controller('rmd')
export class RmdController {
  constructor(private readonly rmdService: RmdService) {}

  @Get()
  async getAllProjects(): Promise<RmdProject[]> {
    return await this.rmdService.findAll();
  }

  @Post()
  async createProject(@Body() projectData: Partial<RmdProject>): Promise<RmdProject> {
    return await this.rmdService.createProject(projectData);
  }
}