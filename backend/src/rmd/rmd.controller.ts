import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequirePermissions } from '../users/guards/require-permissions.decorator';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { RmdService } from './rmd.service';
import { RmdProject } from './rmd.entity';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('rmd')
export class RmdController {
  constructor(private readonly rmdService: RmdService) {}

  @RequirePermissions('rnd.view')
  @Get()
  async getAllProjects(): Promise<RmdProject[]> {
    return await this.rmdService.findAll();
  }

  @RequirePermissions('rnd.create')
  @Post()
  async createProject(@Body() projectData: Partial<RmdProject>): Promise<RmdProject> {
    return await this.rmdService.createProject(projectData);
  }
}