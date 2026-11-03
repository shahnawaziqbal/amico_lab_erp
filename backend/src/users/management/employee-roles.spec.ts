import { DataSource } from 'typeorm';
import { EmployeeRolesService } from './employee-roles.service';

describe('EmployeeRolesService SQLite integration', () => {
  let db: DataSource;
  let service: EmployeeRolesService;

  beforeAll(async () => {
    db = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [],
      synchronize: false,
    });
    await db.initialize();
    await db.query('PRAGMA foreign_keys=ON');

    await db.query(`CREATE TABLE users (
      id INTEGER PRIMARY KEY, username TEXT NOT NULL
    )`);
    await db.query(`CREATE TABLE user_profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      status TEXT NOT NULL
    )`);
    await db.query(`CREATE TABLE roles (
      id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL
    )`);
    await db.query(`CREATE TABLE permissions (
      id INTEGER PRIMARY KEY, code TEXT NOT NULL
    )`);
    await db.query(`CREATE TABLE user_roles (
      user_id INTEGER REFERENCES users(id),
      role_id INTEGER REFERENCES roles(id),
      PRIMARY KEY(user_id,role_id)
    )`);
    await db.query(`CREATE TABLE role_permissions (
      role_id INTEGER, permission_id INTEGER
    )`);
    await db.query(`CREATE TABLE audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER, action TEXT,
      target_type TEXT, target_id TEXT, metadata TEXT
    )`);

    await db.query(`INSERT INTO users VALUES
      (1,'operator'),(2,'employee'),(3,'administrator'),
      (4,'superadmin'),(5,'unprivileged')`);
    await db.query(`INSERT INTO user_profiles VALUES
      (1,'ACTIVE'),(2,'ACTIVE'),(3,'ACTIVE'),
      (4,'ACTIVE'),(5,'ACTIVE')`);
    await db.query(`INSERT INTO roles VALUES
      (1,'SUPER_ADMIN'),(2,'ADMINISTRATOR'),
      (3,'PROCUREMENT_OFFICER'),(4,'AUDITOR'),
      (5,'ROLE_MANAGER'),(6,'HIGH_PRIVILEGE')`);
    await db.query(
      "INSERT INTO permissions VALUES (1,'users.assign_roles')," +
      "(2,'users.reset_password')"
    );
    await db.query(`INSERT INTO role_permissions VALUES
      (5,1),(6,2)`);
    await db.query(`INSERT INTO user_roles VALUES
      (1,5),(2,3),(3,2),(4,1),(5,4)`);

    service = new EmployeeRolesService(db);
  });

  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
  });

  it('assigns multiple roles and writes an audit record', async () => {
    const result = await service.assign(
      2, ['AUDITOR','PROCUREMENT_OFFICER'], 1,
    );

    expect(result.roles).toEqual([
      'AUDITOR','PROCUREMENT_OFFICER',
    ]);

    const assigned = await db.query(
      `SELECT r.code FROM user_roles ur
       JOIN roles r ON r.id=ur.role_id
       WHERE ur.user_id=2 ORDER BY r.code`,
    );
    expect(assigned.map((row: { code: string }) => row.code))
      .toEqual(['AUDITOR','PROCUREMENT_OFFICER']);

    const audits = await db.query(
      "SELECT metadata FROM audit_logs WHERE action='USER_ROLES_CHANGED'"
    );
    expect(audits).toHaveLength(1);
    expect(JSON.parse(audits[0].metadata).newRoles)
      .toEqual(['AUDITOR','PROCUREMENT_OFFICER']);
  });

  it('denies assigning SUPER_ADMIN or ADMINISTRATOR', async () => {
    await expect(
      service.assign(2, ['SUPER_ADMIN'], 1),
    ).rejects.toThrow('Invalid role assignment');

    await expect(
      service.assign(2, ['ADMINISTRATOR'], 1),
    ).rejects.toThrow('Administrator roles require');
  });

  it('protects existing administrator accounts', async () => {
    await expect(
      service.assign(3, ['AUDITOR'], 1),
    ).rejects.toThrow('Administrator roles require');

    await expect(
      service.assign(4, ['AUDITOR'], 1),
    ).rejects.toThrow('Super administrator roles require');
  });

  it('blocks assignment of permissions beyond the actor', async () => {
    const before = await db.query(
      'SELECT role_id FROM user_roles WHERE user_id=2 ORDER BY role_id',
    );

    await expect(
      service.assign(2, ['HIGH_PRIVILEGE'], 1),
    ).rejects.toThrow(
      'Cannot assign roles with permissions you do not possess',
    );

    const after = await db.query(
      'SELECT role_id FROM user_roles WHERE user_id=2 ORDER BY role_id',
    );

    expect(after).toEqual(before);
  });

  it('prevents self-role changes', async () => {
    await expect(
      service.assign(1, ['AUDITOR'], 1),
    ).rejects.toThrow('Cannot modify your own roles');
  });

  it('denies actors without users.assign_roles', async () => {
    await expect(
      service.assign(2, ['AUDITOR'], 5),
    ).rejects.toThrow('Insufficient permissions');
  });

  it('rejects unknown, duplicate and empty role selections', async () => {
    await expect(
      service.assign(2, ['UNKNOWN_ROLE'], 1),
    ).rejects.toThrow('Unknown role');

    await expect(
      service.assign(2, ['AUDITOR','AUDITOR'], 1),
    ).rejects.toThrow('Invalid role assignment');

    await expect(
      service.assign(2, [], 1),
    ).rejects.toThrow('Invalid role assignment');
  });

  it('denies missing employees without changing assignments', async () => {
    await expect(
      service.assign(9999, ['AUDITOR'], 1),
    ).rejects.toThrow('Employee not found');
  });

  it('preserves assignments when the operation fails', async () => {
    const before = await db.query(
      'SELECT role_id FROM user_roles WHERE user_id=2 ORDER BY role_id',
    );

    await expect(
      service.assign(2, ['UNKNOWN_ROLE'], 1),
    ).rejects.toThrow();

    const after = await db.query(
      'SELECT role_id FROM user_roles WHERE user_id=2 ORDER BY role_id',
    );
    expect(after).toEqual(before);
  });
});
