import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  isPermissionCode,
  PermissionCode,
} from './permission-catalog';

type PermissionRow = { code: string };

@Injectable()
export class RbacService {
  constructor(private readonly dataSource: DataSource) {}

  async getEffectivePermissions(userId: number): Promise<PermissionCode[]> {
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return [];
    }

    // Deny by default. The legacy users.role column is not
    // an authorization source. An ACTIVE profile and explicit
    // database role grants are required.
    const rows: PermissionRow[] = await this.dataSource.query(
      `SELECT DISTINCT p.code AS code
       FROM users u
       INNER JOIN user_profiles up
         ON up.user_id = u.id AND up.status = 'ACTIVE'
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id
       INNER JOIN role_permissions rp ON rp.role_id = r.id
       INNER JOIN permissions p ON p.id = rp.permission_id
       WHERE u.id = ?
       ORDER BY p.code ASC`,
      [userId],
    );

    return [...new Set(
      rows
        .map(row => row.code)
        .filter(isPermissionCode),
    )].sort();
  }

  async hasPermission(
    userId: number,
    permission: string,
  ): Promise<boolean> {
    if (!isPermissionCode(permission)) {
      return false;
    }

    const permissions = await this.getEffectivePermissions(userId);
    return permissions.includes(permission);
  }

  async hasAllPermissions(
    userId: number,
    required: readonly string[],
  ): Promise<boolean> {
    if (!required.every(isPermissionCode)) {
      return false;
    }

    const permissions = new Set(
      await this.getEffectivePermissions(userId),
    );

    return required.every(permission =>
      permissions.has(permission as PermissionCode),
    );
  }
}
