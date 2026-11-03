import { DataSource } from 'typeorm';
import { RbacService } from './rbac.service';

describe('RbacService SQLite integration', () => {
  let db: DataSource;
  let service: RbacService;

  beforeAll(async () => {
    db = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [],
      synchronize: false,
    });

    await db.initialize();

    await db.query(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        role TEXT NOT NULL
      )
    `);

    await db.query(`
      CREATE TABLE user_profiles (
        user_id INTEGER PRIMARY KEY,
        status TEXT NOT NULL
      )
    `);

    await db.query(`
      CREATE TABLE roles (
        id INTEGER PRIMARY KEY,
        code TEXT NOT NULL
      )
    `);

    await db.query(`
      CREATE TABLE permissions (
        id INTEGER PRIMARY KEY,
        code TEXT NOT NULL
      )
    `);

    await db.query(`
      CREATE TABLE user_roles (
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL
      )
    `);

    await db.query(`
      CREATE TABLE role_permissions (
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL
      )
    `);

    await db.query(`
      INSERT INTO users (id, username, role)
      VALUES
        (1, 'active-user', 'Employee'),
        (2, 'inactive-user', 'Administrator'),
        (3, 'unassigned-user', 'Administrator'),
        (4, 'no-profile-user', 'Administrator')
    `);

    await db.query(`
      INSERT INTO user_profiles (user_id, status)
      VALUES
        (1, 'ACTIVE'),
        (2, 'SUSPENDED'),
        (3, 'ACTIVE')
    `);

    await db.query(`
      INSERT INTO roles (id, code)
      VALUES (1, 'PROCUREMENT_OFFICER'),
             (2, 'FINANCE_MANAGER')
    `);

    await db.query(`
      INSERT INTO permissions (id, code)
      VALUES
        (1, 'procurement.view'),
        (2, 'procurement.create'),
        (3, 'finance.view'),
        (4, 'finance.approve')
    `);

    await db.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (1, 1), (1, 2), (2, 3), (2, 4)
    `);

    await db.query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (1, 1), (1, 2), (2, 1), (4, 2)
    `);

    service = new RbacService(db);
  });

  afterAll(async () => {
    if (db?.isInitialized) {
      await db.destroy();
    }
  });

  it('combines permissions from multiple roles', async () => {
    expect(await service.getEffectivePermissions(1)).toEqual([
      'finance.approve',
      'finance.view',
      'procurement.create',
      'procurement.view',
    ]);
  });

  it('allows explicitly granted permissions', async () => {
    expect(await service.hasPermission(1, 'finance.approve'))
      .toBe(true);
  });

  it('denies suspended accounts', async () => {
    expect(await service.getEffectivePermissions(2)).toEqual([]);
    expect(await service.hasPermission(2, 'procurement.view'))
      .toBe(false);
  });

  it('denies accounts with no role assignments', async () => {
    expect(await service.getEffectivePermissions(3)).toEqual([]);
  });

  it('denies accounts without an active profile', async () => {
    expect(await service.getEffectivePermissions(4)).toEqual([]);
  });

  it('denies unknown accounts', async () => {
    expect(await service.getEffectivePermissions(9999)).toEqual([]);
  });

  it('requires all requested permissions', async () => {
    expect(await service.hasAllPermissions(1, [
      'finance.view',
      'procurement.create',
    ])).toBe(true);

    expect(await service.hasAllPermissions(1, [
      'finance.view',
      'users.assign_roles',
    ])).toBe(false);
  });

  it('does not authorize through legacy Administrator text', async () => {
    expect(await service.hasPermission(3, 'users.assign_roles'))
      .toBe(false);
  });
});
