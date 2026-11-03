import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../guards/require-permissions.decorator';
import {
  EmployeePasswordResetService,
} from './employee-password-reset.service';

type AuthRequest = { user?: { userId?: number } };

@Controller('auth/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('users.reset_password')
export class EmployeePasswordResetController {
  constructor(
    private readonly passwords: EmployeePasswordResetService,
  ) {}

  @Post(':id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: AuthRequest,
  ) {
    if (!/^[1-9][0-9]*$/.test(id)) {
      throw new BadRequestException('Invalid employee ID');
    }

    const targetId = Number(id);
    const actorId = request.user?.userId;

    if (
      !Number.isSafeInteger(targetId) ||
      !Number.isSafeInteger(actorId) ||
      (actorId ?? 0) <= 0
    ) {
      throw new BadRequestException('Invalid employee identity');
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      throw new BadRequestException('Invalid password reset request');
    }

    const input = body as Record<string, unknown>;

    if (
      Object.keys(input).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(input, 'newPassword') ||
      typeof input.newPassword !== 'string'
    ) {
      throw new BadRequestException('Invalid password reset request');
    }

    return this.passwords.reset(
      targetId,
      input.newPassword,
      actorId as number,
    );
  }
}
