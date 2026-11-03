import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../permissions/rbac.service';
import {
  REQUIRED_PERMISSIONS_KEY,
} from './require-permissions.decorator';
import { PermissionCode } from '../permissions/permission-catalog';

type AuthenticatedRequest = {
  user?: { userId?: number };
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<
      readonly PermissionCode[] | undefined
    >(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // This guard only authorizes endpoints with explicit requirements.
    // No metadata is not equivalent to unrestricted access.
    if (!required || required.length === 0) {
      throw new ForbiddenException('Permission requirement missing');
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.userId;

    if (!Number.isSafeInteger(userId) || (userId ?? 0) <= 0) {
      throw new UnauthorizedException();
    }

    const allowed = await this.rbacService.hasAllPermissions(
      userId as number,
      required,
    );

    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
