import { UsersModule } from '../users/users.module';
import { RbacService } from '../users/permissions/rbac.service';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RmdController } from './rmd.controller';
import { RmdService } from './rmd.service';
import { RmdProject } from './rmd.entity';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([RmdProject])],
  controllers: [RmdController],
  providers: [PermissionsGuard, RbacService, RmdService],
  exports: [RmdService],
})
export class RmdModule {}