import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from '../permissions/permission-catalog';

export const REQUIRED_PERMISSIONS_KEY = 'rbac:required_permissions';

export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
