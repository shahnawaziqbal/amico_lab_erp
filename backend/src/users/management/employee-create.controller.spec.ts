import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { EmployeeCreateController } from './employee-create.controller';
import { EmployeeCreateService } from './employee-create.service';
import { REQUIRED_PERMISSIONS_KEY } from '../guards/require-permissions.decorator';

describe('Employee creation HTTP controller', () => {
  const create = jest.fn();
  const controller = new EmployeeCreateController(
    { create } as unknown as EmployeeCreateService,
  );

  const valid = () => ({
    username: 'employee.one',
    password: 'strong-test-password',
    fullName: 'Employee One',
    email: 'employee.one@example.test',
    roleCodes: ['PROCUREMENT_OFFICER'],
  });

  beforeEach(() => jest.resetAllMocks());

  it('requires both employee creation and role assignment permissions', () => {
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS_KEY,
        EmployeeCreateController,
      ),
    ).toEqual(['users.create', 'users.assign_roles']);
  });

  it('requires JWT authentication and RBAC guards', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      EmployeeCreateController,
    );
    expect(guards.map((guard: { name: string }) => guard.name))
      .toEqual(['JwtAuthGuard', 'PermissionsGuard']);
  });

  it('delegates valid requests with the authenticated actor ID', async () => {
    const response = { id: 10, username: 'employee.one' };
    create.mockResolvedValue(response);

    await expect(
      controller.create(valid(), { user: { userId: 7 } }),
    ).resolves.toEqual(response);

    expect(create).toHaveBeenCalledWith(valid(), 7);
  });

  it('rejects missing or unexpected fields', () => {
    expect(() => controller.create(
      { ...valid(), isAdmin: true },
      { user: { userId: 7 } },
    )).toThrow(BadRequestException);

    expect(() => controller.create(
      { username: 'incomplete' },
      { user: { userId: 7 } },
    )).toThrow(BadRequestException);

    expect(create).not.toHaveBeenCalled();
  });

  it('rejects malformed role assignments', () => {
    expect(() => controller.create(
      { ...valid(), roleCodes: 'SUPER_ADMIN' },
      { user: { userId: 7 } },
    )).toThrow(BadRequestException);

    expect(() => controller.create(
      { ...valid(), roleCodes: [null] },
      { user: { userId: 7 } },
    )).toThrow(BadRequestException);
  });

  it('rejects requests without a valid actor identity', () => {
    expect(() => controller.create(
      valid(),
      {},
    )).toThrow(BadRequestException);

    expect(() => controller.create(
      valid(),
      { user: { userId: -1 } },
    )).toThrow(BadRequestException);
  });

  it('does not convert service authorization failures into success', async () => {
    create.mockRejectedValue(
      new BadRequestException('Administrator not authorized'),
    );

    await expect(
      controller.create(valid(), { user: { userId: 8 } }),
    ).rejects.toThrow('Administrator not authorized');
  });
});
