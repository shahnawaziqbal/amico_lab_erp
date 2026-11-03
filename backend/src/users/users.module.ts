import { EmployeePasswordResetController } from './management/employee-password-reset.controller';
import { EmployeePasswordResetService } from './management/employee-password-reset.service';
import { EmployeeRolesController } from './management/employee-roles.controller';
import { EmployeeRolesService } from './management/employee-roles.service';
import { EmployeeUpdateController } from './management/employee-update.controller';
import { EmployeeUpdateService } from './management/employee-update.service';
import { EmployeeCreateController } from './management/employee-create.controller';
import { EmployeeCreateService } from './management/employee-create.service';
import { UserListController } from './management/user-list.controller';
import { UserListService } from './management/user-list.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { JwtStrategy } from './jwt.strategy';
import {
  UserProfile,
  RbacRole,
  RbacPermission,
  UserRole,
  RolePermission,
  SecurityAuditLog,
} from './entities/rbac.entities';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes');
  }
  return secret;
}

import { RbacService } from './permissions/rbac.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      RbacRole,
      RbacPermission,
      UserRole,
      RolePermission,
      SecurityAuditLog,
    ]),
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: {
        expiresIn: '30m',
      },
    }),
  ],
  controllers: [UsersController,
    UserListController,
    EmployeeCreateController,
    EmployeeUpdateController,
    EmployeeRolesController,
    EmployeePasswordResetController,
  ],
  providers: [UsersService, JwtStrategy,
    RbacService,
    UserListService,
    EmployeeCreateService,
    EmployeeUpdateService,
    EmployeeRolesService,
    EmployeePasswordResetService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
