import { DataSource } from 'typeorm';
import {
  EmployeeUpdateService,
} from './employee-update.service';

describe('EmployeeUpdateService SQLite integration', () => {
  let db: DataSource;
  let service: EmployeeUpdateService;

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
      full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL,
      auth_version INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    await db.query(`CREATE TABLE roles (
      id INTEGER PRIMARY KEY, code TEXT NOT NULL
    )`);
    await db.query(`CREATE TABLE permissions (
      id INTEGER PRIMARY KEY, code TEXT NOT NULL
    )`);
    await db.query(`CREATE TABLE user_roles (
      user_id INTEGER, role_id INTEGER
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
      (1,'admin'), (2,'employee'), (3,'second'),
      (4,'superadmin'), (5,'readonly'),
      (6,'administrator')`);

    await db.query(`INSERT INTO user_profiles
      (user_id,full_name,email,status) VALUES
      (1,'Admin User','admin@example.test','ACTIVE'),
      (2,'Employee User','employee@example.test','ACTIVE'),
      (3,'Second User','second@example.test','ACTIVE'),
      (4,'Super User','super@example.test','ACTIVE'),
      (5,'Read Only','readonly@example.test','ACTIVE'),
      (6,'Administrator','administrator@example.test','ACTIVE')`);

    await db.query(`INSERT INTO roles VALUES
      (1,'MANAGER'), (2,'SUPER_ADMIN'),
      (3,'READER'), (4,'ADMINISTRATOR')`);
    await db.query(`INSERT INTO permissions VALUES
      (1,'users.update'), (2,'users.deactivate')`);
    await db.query(`INSERT INTO user_roles VALUES
      (1,1), (4,2), (5,3), (6,4)`);
    await db.query(`INSERT INTO role_permissions VALUES
      (1,1), (1,2)`);

    service = new EmployeeUpdateService(db);
  });

  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
  });

  it('updates employee details and normalizes email', async () => {
    const result = await service.update(
      2,
      { fullName: 'Updated Employee', email: ' NEW@EXAMPLE.TEST ' },
      1,
    );
    expect(result.fullName).toBe('Updated Employee');
    expect(result.email).toBe('new@example.test');

    const rows = await db.query(
      'SELECT full_name, email FROM user_profiles WHERE user_id=2',
    );
    expect(rows[0]).toEqual({
      full_name: 'Updated Employee',
      email: 'new@example.test',
    });
  });

  it('suspends an employee with separate authorization', async () => {
    const result = await service.update(
      2, { status: 'SUSPENDED' }, 1,
    );
    expect(result.status).toBe('SUSPENDED');

    const rows = await db.query(
      'SELECT status FROM user_profiles WHERE user_id=2',
    );
    expect(rows[0].status).toBe('SUSPENDED');

    const versions = await db.query(
      'SELECT auth_version FROM user_profiles WHERE user_id=2',
    );
    expect(versions[0].auth_version).toBe(1);
  });

  it('revokes tokens on reactivation, not on no-op status changes', async () => {
    await service.update(2, { status: 'ACTIVE' }, 1);

    let rows = await db.query(
      'SELECT auth_version FROM user_profiles WHERE user_id=2',
    );
    expect(rows[0].auth_version).toBe(2);

    await service.update(2, { status: 'ACTIVE' }, 1);

    rows = await db.query(
      'SELECT auth_version FROM user_profiles WHERE user_id=2',
    );
    expect(rows[0].auth_version).toBe(2);
  });

  it('denies status changes without users.deactivate', async () => {
    await expect(
      service.update(2, { status: 'INACTIVE' }, 5),
    ).rejects.toThrow('Insufficient permissions');
  });

  it('denies profile changes without users.update', async () => {
    await expect(
      service.update(2, { fullName: 'Unauthorized Name' }, 5),
    ).rejects.toThrow('Insufficient permissions');
  });

  it('prevents self-suspension and superadmin modification', async () => {
    await expect(
      service.update(1, { status: 'SUSPENDED' }, 1),
    ).rejects.toThrow('Cannot change your own account status');

    await expect(
      service.update(4, { fullName: 'Changed Super' }, 1),
    ).rejects.toThrow('Administrator accounts');

    await expect(
      service.update(6, { fullName: 'Changed Administrator' }, 1),
    ).rejects.toThrow('Administrator accounts');

    await expect(
      service.update(6, { status: 'SUSPENDED' }, 1),
    ).rejects.toThrow('Administrator accounts');
  });

  it('rejects duplicate emails and rolls back updates', async () => {
    await expect(
      service.update(2, {
        fullName: 'Should Roll Back',
        email: 'second@example.test',
      }, 1),
    ).rejects.toThrow('Employee email already exists');

    const rows = await db.query(
      'SELECT full_name FROM user_profiles WHERE user_id=2',
    );
    expect(rows[0].full_name).toBe('Updated Employee');
  });

  it('rejects invalid fields, IDs and missing employees', async () => {
    await expect(
      service.update(2, { roleCodes: ['SUPER_ADMIN'] } as any, 1),
    ).rejects.toThrow('Invalid employee update');

    await expect(
      service.update(-1, { status: 'ACTIVE' }, 1),
    ).rejects.toThrow('Invalid employee update');

    await expect(
      service.update(9999, { status: 'ACTIVE' }, 1),
    ).rejects.toThrow('Employee not found');
  });

  it('records an audit entry without exposing sensitive data', async () => {
    const rows = await db.query(
      "SELECT metadata FROM audit_logs WHERE action='USER_UPDATED'",
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(JSON.parse(rows[0].metadata).changedFields).toEqual([
      'email', 'fullName',
    ]);
    expect(rows[0].metadata).not.toContain('password');
  });
});
