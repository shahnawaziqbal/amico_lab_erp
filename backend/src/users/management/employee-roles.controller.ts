import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../guards/require-permissions.decorator';
import { EmployeeRolesService } from './employee-roles.service';

type AuthRequest = { user?: { userId?: number } };

@Controller('auth/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('users.assign_roles')
export class EmployeeRolesController {
  constructor(private readonly roles: EmployeeRolesService) {}

  @Put(':id/roles')
  assign(
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
      throw new BadRequestException('Invalid role assignment');
    }

    const input = body as Record<string, unknown>;

    if (
      Object.keys(input).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(input, 'roleCodes') ||
      !Array.isArray(input.roleCodes) ||
      !input.roleCodes.every((code) => typeof code === 'string')
    ) {
      throw new BadRequestException('Invalid role assignment');
    }

    return this.roles.assign(
      targetId,
      input.roleCodes as string[],
      actorId as number,
    );
  }
}
