import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { EmployeeRolesController } from './employee-roles.controller';
import { EmployeeRolesService } from './employee-roles.service';
import { REQUIRED_PERMISSIONS_KEY } from '../guards/require-permissions.decorator';

describe('Employee role-management controller', () => {
  const assign = jest.fn();
  const controller = new EmployeeRolesController(
    { assign } as unknown as EmployeeRolesService,
  );
  const actor = { user: { userId: 7 } };

  beforeEach(() => {
    jest.resetAllMocks();
    assign.mockResolvedValue({
      id: 12,
      roles: ['AUDITOR'],
    });
  });

  it('requires JWT and permission guards', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA, EmployeeRolesController,
    );
    expect(guards.map((guard: { name: string }) => guard.name))
      .toEqual(['JwtAuthGuard', 'PermissionsGuard']);
  });

  it('requires users.assign_roles', () => {
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS_KEY,
        EmployeeRolesController,
      ),
    ).toEqual(['users.assign_roles']);
  });

  it('delegates valid role changes with actor identity', async () => {
    await expect(controller.assign(
      '12', { roleCodes: ['AUDITOR'] }, actor,
    )).resolves.toEqual({
      id: 12,
      roles: ['AUDITOR'],
    });

    expect(assign).toHaveBeenCalledWith(12, ['AUDITOR'], 7);
  });

  it('rejects invalid employee IDs', () => {
    for (const id of ['0', '-1', 'abc', '1.5', '9007199254740993']) {
      expect(() => controller.assign(
        id, { roleCodes: ['AUDITOR'] }, actor,
      )).toThrow(BadRequestException);
    }
    expect(assign).not.toHaveBeenCalled();
  });

  it('rejects malformed request bodies', () => {
    const invalid = [
      null,
      [],
      {},
      { roleCodes: 'AUDITOR' },
      { roleCodes: [null] },
      { roleCodes: ['AUDITOR'], isAdmin: true },
    ];

    for (const body of invalid) {
      expect(() => controller.assign('12', body, actor))
        .toThrow(BadRequestException);
    }
    expect(assign).not.toHaveBeenCalled();
  });

  it('rejects missing actor identity', () => {
    expect(() => controller.assign(
      '12', { roleCodes: ['AUDITOR'] }, {},
    )).toThrow(BadRequestException);
    expect(assign).not.toHaveBeenCalled();
  });

  it('propagates service authorization errors', async () => {
    assign.mockRejectedValue(new Error('Insufficient permissions'));
    await expect(controller.assign(
      '12', { roleCodes: ['AUDITOR'] }, actor,
    )).rejects.toThrow('Insufficient permissions');
  });
});
