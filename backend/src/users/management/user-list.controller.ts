import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../guards/require-permissions.decorator';
import { UserListService } from './user-list.service';

function positiveInteger(
  value: string | undefined,
  defaultValue: number,
  maximum: number,
): number {
  if (value === undefined) return defaultValue;

  if (!/^[1-9][0-9]*$/.test(value)) {
    throw new BadRequestException('Invalid pagination parameter');
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new BadRequestException('Invalid pagination parameter');
  }

  return parsed;
}

@Controller('auth/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('users.view')
export class UserListController {
  constructor(private readonly userListService: UserListService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userListService.list(
      positiveInteger(page, 1, 1000000),
      positiveInteger(limit, 20, 100),
    );
  }
}
