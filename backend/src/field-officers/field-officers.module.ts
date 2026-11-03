import { UsersModule } from '../users/users.module';
import { RbacService } from '../users/permissions/rbac.service';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldOfficer } from './field-officers.entity';
import { FieldOfficersService } from './field-officers.service';
import { FieldOfficersController } from './field-officers.controller';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([FieldOfficer])],
  controllers: [FieldOfficersController],
  providers: [PermissionsGuard, RbacService, FieldOfficersService],
  exports: [FieldOfficersService],
})
export class FieldOfficersModule {}