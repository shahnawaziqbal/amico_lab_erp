import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { EmployeeUpdateController } from './employee-update.controller';
import { EmployeeUpdateService } from './employee-update.service';
import { REQUIRED_PERMISSIONS_KEY } from '../guards/require-permissions.decorator';

describe('Employee update controller', () => {
  const update = jest.fn();
  const controller = new EmployeeUpdateController(
    { update } as unknown as EmployeeUpdateService,
  );
  const actor = { user: { userId: 7 } };

  beforeEach(() => {
    jest.resetAllMocks();
    update.mockResolvedValue({ id: 12 });
  });

  it('requires JWT and permission guards', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA, EmployeeUpdateController,
    );
    expect(guards.map((guard: { name: string }) => guard.name))
      .toEqual(['JwtAuthGuard', 'PermissionsGuard']);
  });

  it('requires users.update for profile changes', () => {
    expect(Reflect.getMetadata(
      REQUIRED_PERMISSIONS_KEY,
      controller.updateDetails,
    )).toEqual(['users.update']);
  });

  it('requires users.deactivate for status changes', () => {
    expect(Reflect.getMetadata(
      REQUIRED_PERMISSIONS_KEY,
      controller.updateStatus,
    )).toEqual(['users.deactivate']);
  });

  it('passes validated profile updates and actor identity', async () => {
    await expect(
      controller.updateDetails(
        '12',
        { fullName: 'Employee Updated', email: 'user@example.test' },
        actor,
      ),
    ).resolves.toEqual({ id: 12 });

    expect(update).toHaveBeenCalledWith(
      12,
      { fullName: 'Employee Updated', email: 'user@example.test' },
      7,
    );
  });

  it('passes validated status updates', async () => {
    await controller.updateStatus(
      '12', { status: 'SUSPENDED' }, actor,
    );
    expect(update).toHaveBeenCalledWith(
      12, { status: 'SUSPENDED' }, 7,
    );
  });

  it('rejects status changes through the profile route', () => {
    expect(() => controller.updateDetails(
      '12', { status: 'SUSPENDED' }, actor,
    )).toThrow(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects profile changes through the status route', () => {
    expect(() => controller.updateStatus(
      '12', { status: 'ACTIVE', fullName: 'Override' }, actor,
    )).toThrow(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects invalid IDs and malformed bodies', () => {
    expect(() => controller.updateDetails(
      '0', { fullName: 'Valid Name' }, actor,
    )).toThrow(BadRequestException);
    expect(() => controller.updateStatus(
      'abc', { status: 'ACTIVE' }, actor,
    )).toThrow(BadRequestException);
    expect(() => controller.updateDetails(
      '12', {}, actor,
    )).toThrow(BadRequestException);
    expect(() => controller.updateStatus(
      '12', { status: 'UNKNOWN' }, actor,
    )).toThrow(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects missing actor identity', () => {
    expect(() => controller.updateDetails(
      '12', { fullName: 'New Name' }, {},
    )).toThrow(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it('does not hide service authorization errors', async () => {
    update.mockRejectedValue(new Error('Insufficient permissions'));
    await expect(controller.updateDetails(
      '12', { fullName: 'New Name' }, actor,
    )).rejects.toThrow('Insufficient permissions');
  });
});
