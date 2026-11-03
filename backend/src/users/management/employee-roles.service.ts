import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

type RoleRow = { id: number; code: string };

@Injectable()
export class EmployeeRolesService {
  constructor(private readonly dataSource: DataSource) {}

  async assign(
    targetId: number,
    roleCodes: string[],
    actorId: number,
  ) {
    if (
      !Number.isSafeInteger(targetId) || targetId <= 0 ||
      !Number.isSafeInteger(actorId) || actorId <= 0 ||
      !Array.isArray(roleCodes) ||
      roleCodes.length < 1 || roleCodes.length > 11 ||
      roleCodes.some(code =>
        typeof code !== 'string' ||
        !/^[A-Z][A-Z0-9_]*$/.test(code)
      ) ||
      new Set(roleCodes).size !== roleCodes.length ||
      roleCodes.includes('SUPER_ADMIN')
    ) {
      throw new BadRequestException('Invalid role assignment');
    }

    if (targetId === actorId) {
      throw new ForbiddenException('Cannot modify your own roles');
    }

    return this.dataSource.transaction(async manager => {
      const grants: Array<{ code: string }> = await manager.query(
        `SELECT DISTINCT p.code AS code
         FROM users u
         JOIN user_profiles up
           ON up.user_id = u.id AND up.status = 'ACTIVE'
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN role_permissions rp ON rp.role_id = ur.role_id
         JOIN permissions p ON p.id = rp.permission_id
         WHERE u.id = ? AND p.code = 'users.assign_roles'`,
        [actorId],
      );

      if (grants.length !== 1) {
        throw new ForbiddenException('Insufficient permissions');
      }

      const target: Array<{ id: number }> = await manager.query(
        `SELECT u.id
         FROM users u
         JOIN user_profiles up ON up.user_id = u.id
         WHERE u.id = ? LIMIT 1`,
        [targetId],
      );

      if (target.length !== 1) {
        throw new NotFoundException('Employee not found');
      }

      const previous: RoleRow[] = await manager.query(
        `SELECT r.id, r.code
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = ?`,
        [targetId],
      );

      if (previous.some(role => role.code === 'SUPER_ADMIN')) {
        throw new ForbiddenException(
          'Super administrator roles require a separate procedure',
        );
      }

      // Administrator targets and assignments are protected from
      // ordinary role management; a separate privileged process
      // will handle them.
      if (
        previous.some(role => role.code === 'ADMINISTRATOR') ||
        roleCodes.includes('ADMINISTRATOR')
      ) {
        throw new ForbiddenException(
          'Administrator roles require a separate procedure',
        );
      }

      const placeholders = roleCodes.map(() => '?').join(',');
      const selected: RoleRow[] = await manager.query(
        `SELECT id, code FROM roles
         WHERE code IN (${placeholders})`,
        roleCodes,
      );

      if (selected.length !== roleCodes.length) {
        throw new BadRequestException('Unknown role');
      }

      // Only grant roles whose effective permissions are already
      // held by the acting account. This prevents privilege escalation.
      const actorPermissions: Array<{ code: string }> =
        await manager.query(
          `SELECT DISTINCT p.code
           FROM user_roles ur
           JOIN role_permissions rp ON rp.role_id = ur.role_id
           JOIN permissions p ON p.id = rp.permission_id
           WHERE ur.user_id = ?`,
          [actorId],
        );

      const assignablePermissions: Array<{ code: string }> =
        await manager.query(
          `SELECT DISTINCT p.code
           FROM roles r
           JOIN role_permissions rp ON rp.role_id = r.id
           JOIN permissions p ON p.id = rp.permission_id
           WHERE r.id IN (${selected.map(() => '?').join(',')})`,
          selected.map(role => role.id),
        );

      const allowed = new Set(actorPermissions.map(p => p.code));

      if (
        assignablePermissions.some(permission =>
          !allowed.has(permission.code)
        )
      ) {
        throw new ForbiddenException(
          'Cannot assign roles with permissions you do not possess',
        );
      }

      await manager.query(
        'DELETE FROM user_roles WHERE user_id = ?',
        [targetId],
      );

      for (const role of selected) {
        await manager.query(
          'INSERT INTO user_roles(user_id,role_id) VALUES (?,?)',
          [targetId, role.id],
        );
      }

      await manager.query(
        `INSERT INTO audit_logs
           (actor_user_id,action,target_type,target_id,metadata)
         VALUES (?,'USER_ROLES_CHANGED','USER',?,?)`,
        [
          actorId,
          String(targetId),
          JSON.stringify({
            previousRoles: previous.map(r => r.code).sort(),
            newRoles: [...roleCodes].sort(),
          }),
        ],
      );

      return {
        id: targetId,
        roles: [...roleCodes].sort(),
      };
    });
  }
}
