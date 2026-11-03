import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeePasswordResetService {
  constructor(private readonly dataSource: DataSource) {}

  async reset(
    targetId: number,
    newPassword: string,
    actorId: number,
  ) {
    if (
      !Number.isSafeInteger(targetId) || targetId <= 0 ||
      !Number.isSafeInteger(actorId) || actorId <= 0 ||
      typeof newPassword !== 'string' ||
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      throw new BadRequestException('Invalid password reset request');
    }

    if (targetId === actorId) {
      throw new ForbiddenException(
        'Use the self-service password change procedure',
      );
    }

    // Hash before opening a database write transaction.
    const hash = await bcrypt.hash(newPassword, 12);

    return this.dataSource.transaction(async manager => {
      const permissions: Array<{ code: string }> = await manager.query(
        `SELECT DISTINCT p.code
         FROM users u
         JOIN user_profiles up
           ON up.user_id = u.id AND up.status = 'ACTIVE'
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN role_permissions rp ON rp.role_id = ur.role_id
         JOIN permissions p ON p.id = rp.permission_id
         WHERE u.id = ? AND p.code = 'users.reset_password'`,
        [actorId],
      );

      if (permissions.length !== 1) {
        throw new ForbiddenException('Insufficient permissions');
      }

      const targets: Array<{ id: number }> = await manager.query(
        `SELECT u.id
         FROM users u
         JOIN user_profiles up ON up.user_id = u.id
         WHERE u.id = ? LIMIT 1`,
        [targetId],
      );

      if (targets.length !== 1) {
        throw new NotFoundException('Employee not found');
      }

      const protectedRoles: Array<{ code: string }> =
        await manager.query(
          `SELECT r.code
           FROM user_roles ur
           JOIN roles r ON r.id = ur.role_id
           WHERE ur.user_id = ?
             AND r.code IN ('SUPER_ADMIN', 'ADMINISTRATOR')`,
          [targetId],
        );

      if (protectedRoles.length > 0) {
        throw new ForbiddenException(
          'Administrator password changes require a separate procedure',
        );
      }

      await manager.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hash, targetId],
      );

      await manager.query(
        `UPDATE user_profiles
         SET auth_version = auth_version + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [targetId],
      );

      await manager.query(
        `INSERT INTO audit_logs
           (actor_user_id,action,target_type,target_id,metadata)
         VALUES (?,'USER_PASSWORD_RESET','USER',?,?)`,
        [
          actorId,
          String(targetId),
          JSON.stringify({
            method: 'ADMIN_RESET',
            sessionsRevocationRequired: true,
          }),
        ],
      );

      return {
        id: targetId,
        passwordReset: true,
        sessionsRevocationRequired: true,
      };
    });
  }
}
