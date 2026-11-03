import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../guards/require-permissions.decorator';
import {
  EmployeeUpdateService,
  EmployeeUpdateInput,
} from './employee-update.service';

type AuthRequest = { user?: { userId?: number } };

function parseUserId(raw: string): number {
  if (!/^[1-9][0-9]*$/.test(raw)) {
    throw new BadRequestException('Invalid employee ID');
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed)) {
    throw new BadRequestException('Invalid employee ID');
  }
  return parsed;
}

function parseFields(
  body: unknown,
  allowed: readonly string[],
): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Invalid employee update');
  }
  const fields = body as Record<string, unknown>;
  const names = Object.keys(fields);

  if (
    names.length === 0 ||
    names.some((name) => !allowed.includes(name))
  ) {
    throw new BadRequestException('Invalid employee update');
  }
  return fields;
}

function actorId(request: AuthRequest): number {
  const id = request.user?.userId;
  if (!Number.isSafeInteger(id) || (id ?? 0) <= 0) {
    throw new BadRequestException('Invalid administrator identity');
  }
  return id as number;
}

@Controller('auth/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeeUpdateController {
  constructor(private readonly employees: EmployeeUpdateService) {}

  @Patch(':id')
  @RequirePermissions('users.update')
  updateDetails(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: AuthRequest,
  ) {
    const fields = parseFields(body, ['fullName', 'email']);
    for (const value of Object.values(fields)) {
      if (typeof value !== 'string') {
        throw new BadRequestException('Invalid employee update');
      }
    }

    return this.employees.update(
      parseUserId(id),
      fields as EmployeeUpdateInput,
      actorId(request),
    );
  }

  @Patch(':id/status')
  @RequirePermissions('users.deactivate')
  updateStatus(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: AuthRequest,
  ) {
    const fields = parseFields(body, ['status']);
    if (
      Object.keys(fields).length !== 1 ||
      !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(
        fields.status as string,
      )
    ) {
      throw new BadRequestException('Invalid account status');
    }

    return this.employees.update(
      parseUserId(id),
      { status: fields.status as EmployeeUpdateInput['status'] },
      actorId(request),
    );
  }
}
