import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import {
  EmployeePasswordResetController,
} from './employee-password-reset.controller';
import {
  EmployeePasswordResetService,
} from './employee-password-reset.service';
import {
  REQUIRED_PERMISSIONS_KEY,
} from '../guards/require-permissions.decorator';

describe('Employee password reset controller', () => {
  const reset = jest.fn();
  const controller = new EmployeePasswordResetController(
    { reset } as unknown as EmployeePasswordResetService,
  );
  const actor = { user: { userId: 7 } };

  beforeEach(() => {
    jest.resetAllMocks();
    reset.mockResolvedValue({
      id: 12,
      passwordReset: true,
    });
  });

  it('requires JWT and permissions guards', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA, EmployeePasswordResetController,
    );
    expect(guards.map((g: { name: string }) => g.name))
      .toEqual(['JwtAuthGuard', 'PermissionsGuard']);
  });

  it('requires users.reset_password', () => {
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS_KEY,
        EmployeePasswordResetController,
      ),
    ).toEqual(['users.reset_password']);
  });

  it('delegates a valid password reset to the service', async () => {
    const body = { newPassword: 'New-Strong-Password-2026!' };

    await expect(
      controller.resetPassword('12', body, actor),
    ).resolves.toEqual({
      id: 12,
      passwordReset: true,
    });

    expect(reset).toHaveBeenCalledWith(
      12,
      'New-Strong-Password-2026!',
      7,
    );
  });

  it('rejects invalid employee IDs', () => {
    for (const id of ['0', '-1', 'abc', '1.5', '9007199254740993']) {
      expect(() => controller.resetPassword(
        id, { newPassword: 'New-Strong-Password-2026!' }, actor,
      )).toThrow(BadRequestException);
    }
    expect(reset).not.toHaveBeenCalled();
  });

  it('rejects malformed request bodies', () => {
    const invalid = [
      null,
      [],
      {},
      { newPassword: 1234 },
      { password: 'New-Strong-Password-2026!' },
      {
        newPassword: 'New-Strong-Password-2026!',
        roleCodes: ['SUPER_ADMIN'],
      },
    ];

    for (const body of invalid) {
      expect(() => controller.resetPassword('12', body, actor))
        .toThrow(BadRequestException);
    }
    expect(reset).not.toHaveBeenCalled();
  });

  it('rejects missing authenticated identity', () => {
    expect(() => controller.resetPassword(
      '12', { newPassword: 'New-Strong-Password-2026!' }, {},
    )).toThrow(BadRequestException);

    expect(reset).not.toHaveBeenCalled();
  });

  it('propagates service authorization failures', async () => {
    reset.mockRejectedValue(new Error('Insufficient permissions'));

    await expect(controller.resetPassword(
      '12',
      { newPassword: 'New-Strong-Password-2026!' },
      actor,
    )).rejects.toThrow('Insufficient permissions');
  });
});
