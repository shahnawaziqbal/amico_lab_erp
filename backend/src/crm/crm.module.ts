import { UsersModule } from '../users/users.module';
import { RbacService } from '../users/permissions/rbac.service';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { Customer } from './crm.entity';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([Customer])],
  controllers: [CrmController],
  providers: [PermissionsGuard, RbacService, CrmService],
  exports: [CrmService],
})
export class CrmModule {}