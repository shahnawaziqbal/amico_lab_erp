import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../guards/require-permissions.decorator';
import {
  CreateEmployeeInput,
  EmployeeCreateService,
} from './employee-create.service';

type AuthRequest = {
  user?: { userId?: number };
};

@Controller('auth/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('users.create', 'users.assign_roles')
export class EmployeeCreateController {
  constructor(
    private readonly employeeCreateService: EmployeeCreateService,
  ) {}

  @Post()
  create(@Body() body: unknown, @Req() request: AuthRequest) {
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      throw new BadRequestException('Invalid employee details');
    }

    const input = body as Record<string, unknown>;
    const allowed = new Set([
      'username',
      'password',
      'fullName',
      'email',
      'roleCodes',
    ]);

    if (
      Object.keys(input).length !== allowed.size ||
      Object.keys(input).some((key) => !allowed.has(key)) ||
      typeof input.username !== 'string' ||
      typeof input.password !== 'string' ||
      typeof input.fullName !== 'string' ||
      typeof input.email !== 'string' ||
      !Array.isArray(input.roleCodes) ||
      !input.roleCodes.every((role) => typeof role === 'string')
    ) {
      throw new BadRequestException('Invalid employee details');
    }

    const actorUserId = request.user?.userId;
    if (!Number.isSafeInteger(actorUserId) || (actorUserId ?? 0) <= 0) {
      throw new BadRequestException('Invalid administrator identity');
    }

    return this.employeeCreateService.create(
      input as CreateEmployeeInput,
      actorUserId as number,
    );
  }
}
