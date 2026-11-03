import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { DataSource } from 'typeorm';
import { UserListService } from './user-list.service';
import { UserListController } from './user-list.controller';
import { REQUIRED_PERMISSIONS_KEY } from '../guards/require-permissions.decorator';

describe('Protected user listing', () => {
  const query = jest.fn();
  let service: UserListService;
  let controller: UserListController;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new UserListService(
      { query } as unknown as DataSource,
    );
    controller = new UserListController(service);
  });

  it('requires the users.view permission', () => {
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, UserListController),
    ).toEqual(['users.view']);
  });

  it('requires both authentication and permission guards', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      UserListController,
    );
    expect(guards).toHaveLength(2);
    expect(guards.map((guard: { name: string }) => guard.name))
      .toEqual(['JwtAuthGuard', 'PermissionsGuard']);
  });

  it('returns only safe, explicitly selected user fields', async () => {
    query
      .mockResolvedValueOnce([{ total: 1 }])
      .mockResolvedValueOnce([{
        id: 7,
        username: 'employee',
        fullName: 'Employee Example',
        email: 'employee@example.test',
        status: 'ACTIVE',
        roleCodes: 'AUDITOR,PROCUREMENT_OFFICER',
        password: 'must-never-appear',
      }]);

    const response = await controller.list();

    expect(response.users).toEqual([{
      id: 7,
      username: 'employee',
      fullName: 'Employee Example',
      email: 'employee@example.test',
      status: 'ACTIVE',
      roles: ['AUDITOR', 'PROCUREMENT_OFFICER'],
    }]);

    expect(JSON.stringify(response)).not.toContain(
      'must-never-appear',
    );
    expect(JSON.stringify(response)).not.toContain('password');

    const sql = query.mock.calls[1][0] as string;
    expect(sql).not.toMatch(/u\.password|SELECT\s+\*/i);
  });

  it('uses parameterized pagination', async () => {
    query
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([]);

    const response = await controller.list('2', '10');

    expect(response.page).toBe(2);
    expect(response.limit).toBe(10);
    expect(query.mock.calls[1][1]).toEqual([10, 10]);
  });

  it('rejects invalid pagination values', async () => {
    expect(() => controller.list('0', '10'))
      .toThrow(BadRequestException);
    expect(() => controller.list('1', '101'))
      .toThrow(BadRequestException);
    expect(() => controller.list('1 OR 1=1', '10'))
      .toThrow(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });

  it('returns empty results safely', async () => {
    query
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([]);

    expect(await controller.list()).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      users: [],
    });
  });
});
