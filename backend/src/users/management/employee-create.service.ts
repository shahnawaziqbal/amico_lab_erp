import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export type CreateEmployeeInput = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  roleCodes: string[];
};

type RoleRow = { id: number; code: string };

@Injectable()
export class EmployeeCreateService {
  constructor(private readonly dataSource: DataSource) {}

  async create(input: CreateEmployeeInput, actorUserId: number) {
    if (!Number.isSafeInteger(actorUserId) || actorUserId <= 0) {
      throw new BadRequestException('Invalid administrator identity');
    }

    if (
      !input ||
      typeof input.username !== 'string' ||
      typeof input.password !== 'string' ||
      typeof input.fullName !== 'string' ||
      typeof input.email !== 'string' ||
      !Array.isArray(input.roleCodes)
    ) {
      throw new BadRequestException('Invalid employee details');
    }

    const username = input.username.trim();
    const fullName = input.fullName.trim();
    const email = input.email.trim().toLowerCase();
    const password = input.password;
    const roleCodes = input.roleCodes;

    if (
      !/^[a-zA-Z0-9._@-]{3,100}$/.test(username) ||
      fullName.length < 2 ||
      fullName.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      Buffer.byteLength(password, 'utf8') < 8 ||
      Buffer.byteLength(password, 'utf8') > 128
    ) {
      throw new BadRequestException('Invalid employee details');
    }

    if (
      roleCodes.length === 0 ||
      roleCodes.length > 11 ||
      !roleCodes.every(
        (code) =>
          typeof code === 'string' &&
          /^[A-Z][A-Z0-9_]*$/.test(code),
      ) ||
      new Set(roleCodes).size !== roleCodes.length ||
      roleCodes.includes('SUPER_ADMIN') ||
      (roleCodes.includes('ADMINISTRATOR') && roleCodes.length !== 1)
    ) {
      throw new BadRequestException('Invalid role assignment');
    }

    // Expensive password hashing happens before acquiring a write lock.
    const hash = await bcrypt.hash(password, 12);

    try {
      return await this.dataSource.transaction(async (manager) => {
        // Ensure the acting administrator still has the privilege
        // when the transaction executes, not only at the HTTP guard.
        const authorized: Array<{ id: number }> = await manager.query(
          `SELECT u.id
           FROM users u
           JOIN user_profiles up
             ON up.user_id = u.id AND up.status = 'ACTIVE'
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN role_permissions rp ON rp.role_id = ur.role_id
           JOIN permissions p ON p.id = rp.permission_id
           WHERE u.id = ?
             AND p.code IN ('users.create', 'users.assign_roles')
           GROUP BY u.id
           HAVING COUNT(DISTINCT p.code) = 2`,
          [actorUserId],
        );

        if (authorized.length !== 1) {
          throw new BadRequestException('Administrator not authorized');
        }

        // Only an active SUPER_ADMIN may create an ADMINISTRATOR.
        if (roleCodes.includes('ADMINISTRATOR')) {
          const superAdmin: Array<{ id: number }> = await manager.query(
            `SELECT u.id
             FROM users u
             JOIN user_profiles up
               ON up.user_id = u.id AND up.status = 'ACTIVE'
             JOIN user_roles ur ON ur.user_id = u.id
             JOIN roles r ON r.id = ur.role_id
             WHERE u.id = ? AND r.code = 'SUPER_ADMIN'
             LIMIT 1`,
            [actorUserId],
          );

          if (superAdmin.length !== 1) {
            throw new BadRequestException(
              'Only an active Super Admin can create an Administrator',
            );
          }
        }

        const placeholders = roleCodes.map(() => '?').join(',');
        const found: RoleRow[] = await manager.query(
          `SELECT id, code FROM roles WHERE code IN (${placeholders})`,
          roleCodes,
        );

        if (found.length !== roleCodes.length) {
          throw new BadRequestException('Unknown employee role');
        }

        // Prevent creation of an employee with permissions
        // beyond those held by the acting administrator.
        const actorPermissions: Array<{ code: string }> =
          await manager.query(
            `SELECT DISTINCT p.code
             FROM user_roles ur
             JOIN role_permissions rp ON rp.role_id = ur.role_id
             JOIN permissions p ON p.id = rp.permission_id
             WHERE ur.user_id = ?`,
            [actorUserId],
          );

        const requestedPermissions: Array<{ code: string }> =
          await manager.query(
            `SELECT DISTINCT p.code
             FROM role_permissions rp
             JOIN permissions p ON p.id = rp.permission_id
             WHERE rp.role_id IN (${found.map(() => '?').join(',')})`,
            found.map(role => role.id),
          );

        const allowed = new Set(
          actorPermissions.map(permission => permission.code),
        );

        if (
          requestedPermissions.some(
            permission => !allowed.has(permission.code),
          )
        ) {
          throw new BadRequestException(
            'Cannot create employees with permissions you do not possess',
          );
        }

        const existing = await manager.query(
          `SELECT u.id FROM users u
           LEFT JOIN user_profiles up ON up.user_id = u.id
           WHERE lower(u.username) = lower(?) OR lower(up.email) = ?
           LIMIT 1`,
          [username, email],
        );

        if (existing.length) {
          throw new ConflictException('Employee account already exists');
        }

        const created = await manager.query(
          `INSERT INTO users (username, password, role)
           VALUES (?, ?, 'Employee')
           RETURNING id`,
          [username, hash],
        );

        const userId = Number(created[0]?.id);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
          throw new Error('Employee insertion did not return an ID');
        }

        await manager.query(
          `INSERT INTO user_profiles
             (user_id, full_name, email, status)
           VALUES (?, ?, ?, 'ACTIVE')`,
          [userId, fullName, email],
        );

        for (const role of found) {
          await manager.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
            [userId, role.id],
          );
        }

        await manager.query(
          `INSERT INTO audit_logs
             (actor_user_id, action, target_type, target_id, metadata)
           VALUES (?, 'USER_CREATED', 'USER', ?, ?)`,
          [
            actorUserId,
            String(userId),
            JSON.stringify({ roleCodes: [...roleCodes].sort() }),
          ],
        );

        // Never return the password or its hash.
        return {
          id: userId,
          username,
          fullName,
          email,
          status: 'ACTIVE',
          roles: [...roleCodes].sort(),
        };
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // A uniqueness race must not leak SQLite errors or account data.
      const message = error instanceof Error ? error.message : '';
      if (/UNIQUE constraint failed/i.test(message)) {
        throw new ConflictException('Employee account already exists');
      }

      throw error;
    }
  }
}
