import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

export type EmployeeUpdateInput = {
  fullName?: string;
  email?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
};

type EmployeeRow = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  status: string;
};

@Injectable()
export class EmployeeUpdateService {
  constructor(private readonly dataSource: DataSource) {}

  async update(
    targetUserId: number,
    input: EmployeeUpdateInput,
    actorUserId: number,
  ) {
    if (
      !Number.isSafeInteger(targetUserId) || targetUserId <= 0 ||
      !Number.isSafeInteger(actorUserId) || actorUserId <= 0 ||
      !input || typeof input !== 'object' || Array.isArray(input)
    ) {
      throw new BadRequestException('Invalid employee update');
    }

    const fields = Object.keys(input);
    const allowed = new Set(['fullName', 'email', 'status']);

    if (
      fields.length === 0 ||
      fields.some((field) => !allowed.has(field))
    ) {
      throw new BadRequestException('Invalid employee update');
    }

    let fullName: string | undefined;
    let email: string | undefined;

    if (input.fullName !== undefined) {
      if (typeof input.fullName !== 'string') {
        throw new BadRequestException('Invalid employee name');
      }
      fullName = input.fullName.trim();
      if (fullName.length < 2 || fullName.length > 150) {
        throw new BadRequestException('Invalid employee name');
      }
    }

    if (input.email !== undefined) {
      if (typeof input.email !== 'string') {
        throw new BadRequestException('Invalid employee email');
      }
      email = input.email.trim().toLowerCase();
      if (
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        throw new BadRequestException('Invalid employee email');
      }
    }

    const status = input.status;
    if (
      status !== undefined &&
      !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)
    ) {
      throw new BadRequestException('Invalid account status');
    }

    const changesProfile =
      fullName !== undefined || email !== undefined;
    const changesStatus = status !== undefined;

    if (changesStatus && targetUserId === actorUserId) {
      throw new ForbiddenException('Cannot change your own account status');
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const required: string[] = [];
        if (changesProfile) required.push('users.update');
        if (changesStatus) required.push('users.deactivate');

        const placeholders = required.map(() => '?').join(',');
        const grants: Array<{ code: string }> = await manager.query(
          `SELECT DISTINCT p.code AS code
           FROM users u
           JOIN user_profiles up
             ON up.user_id = u.id AND up.status = 'ACTIVE'
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN role_permissions rp ON rp.role_id = ur.role_id
           JOIN permissions p ON p.id = rp.permission_id
           WHERE u.id = ? AND p.code IN (${placeholders})`,
          [actorUserId, ...required],
        );

        const granted = new Set(grants.map((row) => row.code));
        if (!required.every((code) => granted.has(code))) {
          throw new ForbiddenException('Insufficient permissions');
        }

        const targets: EmployeeRow[] = await manager.query(
          `SELECT u.id, u.username,
                  up.full_name AS fullName,
                  up.email, up.status
           FROM users u
           JOIN user_profiles up ON up.user_id = u.id
           WHERE u.id = ? LIMIT 1`,
          [targetUserId],
        );

        if (targets.length !== 1) {
          throw new NotFoundException('Employee not found');
        }

        const protectedRoles: Array<{ code: string }> =
          await manager.query(
            `SELECT r.code FROM user_roles ur
             JOIN roles r ON r.id = ur.role_id
             WHERE ur.user_id = ?
               AND r.code IN ('SUPER_ADMIN', 'ADMINISTRATOR')
             LIMIT 1`,
            [targetUserId],
          );

        if (protectedRoles.length) {
          throw new ForbiddenException(
            'Administrator accounts require a separate procedure',
          );
        }

        const previous = targets[0];
        const next = {
          fullName: fullName ?? previous.fullName,
          email: email ?? previous.email,
          status: status ?? previous.status,
        };

        await manager.query(
          `UPDATE user_profiles
           SET full_name = ?, email = ?, status = ?,
               auth_version = auth_version + ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`,
          [
            next.fullName,
            next.email,
            next.status,
            changesStatus && next.status !== previous.status ? 1 : 0,
            targetUserId,
          ],
        );

        await manager.query(
          `INSERT INTO audit_logs
             (actor_user_id, action, target_type, target_id, metadata)
           VALUES (?, 'USER_UPDATED', 'USER', ?, ?)`,
          [
            actorUserId,
            String(targetUserId),
            JSON.stringify({
              changedFields: fields.sort(),
              previousStatus: previous.status,
              newStatus: next.status,
            }),
          ],
        );

        return {
          id: targetUserId,
          username: previous.username,
          ...next,
        };
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      if (
        error instanceof Error &&
        /UNIQUE constraint failed/i.test(error.message)
      ) {
        throw new ConflictException('Employee email already exists');
      }
      throw error;
    }
  }
}
