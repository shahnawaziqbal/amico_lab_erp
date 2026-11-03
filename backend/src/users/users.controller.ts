import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RbacService } from './permissions/rbac.service';

@Controller('auth')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rbacService: RbacService,
  ) {}

  @Post('login')
  async login(@Body() body: {
    username?: string;
    pass?: string;
  }) {
    if (
      typeof body?.username !== 'string' ||
      typeof body?.pass !== 'string'
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.usersService.validateUser(
      body.username,
      body.pass,
    );

    return this.usersService.login(user);
  }

  @Get('me/permissions')
  @UseGuards(JwtAuthGuard)
  async myPermissions(
    @Req() request: { user?: { userId?: number; username?: string } },
  ) {
    const userId = request.user?.userId;

    if (!Number.isSafeInteger(userId) || !userId || userId <= 0) {
      throw new UnauthorizedException('Invalid authenticated user');
    }

    const permissions = await this.rbacService.getEffectivePermissions(
      userId,
    );

    return {
      username: request.user?.username,
      permissions,
    };
  }

}
