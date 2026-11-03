import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { RbacService } from '../permissions/rbac.service';

describe('PermissionsGuard', () => {
  const hasAllPermissions = jest.fn();
  const getAllAndOverride = jest.fn();

  const guard = new PermissionsGuard(
    { getAllAndOverride } as unknown as Reflector,
    { hasAllPermissions } as unknown as RbacService,
  );

  function context(userId?: number): ExecutionContext {
    return {
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({
        getRequest: () => ({
          user: userId === undefined ? undefined : { userId },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('denies routes without permission metadata', async () => {
    getAllAndOverride.mockReturnValue(undefined);
    await expect(guard.canActivate(context(1)))
      .rejects.toThrow(ForbiddenException);
    expect(hasAllPermissions).not.toHaveBeenCalled();
  });

  it('denies empty permission requirements', async () => {
    getAllAndOverride.mockReturnValue([]);
    await expect(guard.canActivate(context(1)))
      .rejects.toThrow(ForbiddenException);
  });

  it('denies requests without an authenticated identity', async () => {
    getAllAndOverride.mockReturnValue(['procurement.view']);
    await expect(guard.canActivate(context()))
      .rejects.toThrow(UnauthorizedException);
    expect(hasAllPermissions).not.toHaveBeenCalled();
  });

  it('denies invalid user identifiers', async () => {
    getAllAndOverride.mockReturnValue(['procurement.view']);
    for (const id of [0, -1, 1.5, NaN]) {
      await expect(guard.canActivate(context(id)))
        .rejects.toThrow(UnauthorizedException);
    }
    expect(hasAllPermissions).not.toHaveBeenCalled();
  });

  it('denies employees missing permission grants', async () => {
    getAllAndOverride.mockReturnValue(['finance.approve']);
    hasAllPermissions.mockResolvedValue(false);
    await expect(guard.canActivate(context(7)))
      .rejects.toThrow(ForbiddenException);
    expect(hasAllPermissions)
      .toHaveBeenCalledWith(7, ['finance.approve']);
  });

  it('allows employees with all required permissions', async () => {
    const required = ['procurement.view', 'procurement.approve'];
    getAllAndOverride.mockReturnValue(required);
    hasAllPermissions.mockResolvedValue(true);
    await expect(guard.canActivate(context(7)))
      .resolves.toBe(true);
    expect(hasAllPermissions).toHaveBeenCalledWith(7, required);
  });

  it('propagates database failures instead of granting access', async () => {
    getAllAndOverride.mockReturnValue(['finance.view']);
    hasAllPermissions.mockRejectedValue(new Error('Database unavailable'));
    await expect(guard.canActivate(context(7)))
      .rejects.toThrow('Database unavailable');
  });
});
