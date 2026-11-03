import { DataSource } from 'typeorm';
import { RbacService } from './rbac.service';

describe('RbacService', () => {
  let query: jest.Mock;
  let service: RbacService;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue([]);
    service = new RbacService(
      { query } as unknown as DataSource,
    );
  });

  it('denies access when a user has no role grants', async () => {
    expect(await service.getEffectivePermissions(10)).toEqual([]);
    expect(await service.hasPermission(10, 'finance.approve'))
      .toBe(false);
  });

  it('requires an active user profile and explicit role joins', async () => {
    await service.getEffectivePermissions(10);
    const [sql, parameters] = query.mock.calls[0];

    expect(sql).toContain('FROM users u');
    expect(sql).toContain('INNER JOIN user_profiles up');
    expect(sql).toContain("up.status = 'ACTIVE'");
    expect(sql).toContain('INNER JOIN user_roles ur');
    expect(sql).toContain('INNER JOIN role_permissions rp');
    expect(sql).toContain('WHERE u.id = ?');
    expect(sql).not.toContain('u.role =');
    expect(parameters).toEqual([10]);
  });

  it('combines distinct permissions across multiple roles', async () => {
    query.mockResolvedValue([
      { code: 'procurement.view' },
      { code: 'finance.view' },
      { code: 'procurement.view' },
      { code: 'finance.approve' },
    ]);

    expect(await service.getEffectivePermissions(5)).toEqual([
      'finance.approve',
      'finance.view',
      'procurement.view',
    ]);
  });

  it('rejects invalid user identifiers without querying DB', async () => {
    for (const id of [0, -1, NaN, 1.5, Infinity]) {
      expect(await service.getEffectivePermissions(id)).toEqual([]);
    }
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects permissions outside the approved catalog', async () => {
    expect(await service.hasPermission(5, 'system.unrestricted'))
      .toBe(false);
    expect(query).not.toHaveBeenCalled();
  });

  it('does not invent permissions from unexpected DB values', async () => {
    query.mockResolvedValue([
      { code: 'procurement.view' },
      { code: 'not.a.real.permission' },
    ]);

    expect(await service.getEffectivePermissions(5))
      .toEqual(['procurement.view']);
  });

  it('requires every permission for an all-of check', async () => {
    query.mockResolvedValue([
      { code: 'procurement.view' },
    ]);

    expect(await service.hasAllPermissions(5, [
      'procurement.view',
      'procurement.approve',
    ])).toBe(false);

    expect(await service.hasAllPermissions(5, [
      'procurement.view',
    ])).toBe(true);
  });

  it('rejects unrecognized permissions in all-of checks', async () => {
    expect(await service.hasAllPermissions(5, [
      'procurement.view',
      'invalid.permission',
    ])).toBe(false);
    expect(query).not.toHaveBeenCalled();
  });
});
