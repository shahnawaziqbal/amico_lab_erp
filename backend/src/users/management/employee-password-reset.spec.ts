import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  EmployeePasswordResetService,
} from './employee-password-reset.service';

describe('Employee password reset SQLite integration', () => {
  let db: DataSource;
  let service: EmployeePasswordResetService;

  beforeAll(async () => {
    db = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [],
      synchronize: false,
    });
    await db.initialize();

    await db.query(`CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      password TEXT NOT NULL
    )`);

    await db.query(`CREATE TABLE user_profiles (
      user_id INTEGER PRIMARY KEY,
      status TEXT NOT NULL,
      auth_version INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.query(`CREATE TABLE roles (
      id INTEGER PRIMARY KEY,
      code TEXT NOT NULL
    )`);

    await db.query(`CREATE TABLE permissions (
      id INTEGER PRIMARY KEY,
      code TEXT NOT NULL
    )`);

    await db.query(`CREATE TABLE user_roles (
      user_id INTEGER,
      role_id INTEGER
    )`);

    await db.query(`CREATE TABLE role_permissions (
      role_id INTEGER,
      permission_id INTEGER
    )`);

    await db.query(`CREATE TABLE audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER,
      action TEXT,
      target_type TEXT,
      target_id TEXT,
      metadata TEXT
    )`);

    await db.query(`INSERT INTO users VALUES
      (1,'security_admin','old-hash'),
      (2,'employee','old-employee-hash'),
      (3,'readonly','old-hash'),
      (4,'other_admin','old-hash'),
      (5,'super_admin','old-hash')`);

    await db.query(`INSERT INTO user_profiles(user_id,status)
      VALUES (1,'ACTIVE'),(2,'ACTIVE'),(3,'ACTIVE'),
             (4,'ACTIVE'),(5,'ACTIVE')`);

    await db.query(`INSERT INTO roles VALUES
      (1,'RESET_MANAGER'),(2,'AUDITOR'),
      (3,'ADMINISTRATOR'),(4,'SUPER_ADMIN')`);

    await db.query(
      "INSERT INTO permissions VALUES (1,'users.reset_password')"
    );

    await db.query(
      'INSERT INTO role_permissions VALUES (1,1)'
    );

    await db.query(`INSERT INTO user_roles VALUES
      (1,1),(2,2),(3,2),(4,3),(5,4)`);

    service = new EmployeePasswordResetService(db);
  });

  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
  });

  it('hashes a new password and increments the auth version', async () => {
    const result = await service.reset(
      2, 'Strong-Temporary-Password-2026!', 1,
    );

    expect(result.passwordReset).toBe(true);

    const rows = await db.query(
      `SELECT u.password,up.auth_version
       FROM users u
       JOIN user_profiles up ON up.user_id=u.id
       WHERE u.id=2`,
    );

    expect(rows[0].password).not.toBe(
      'Strong-Temporary-Password-2026!',
    );
    expect(await bcrypt.compare(
      'Strong-Temporary-Password-2026!',
      rows[0].password,
    )).toBe(true);
    expect(rows[0].auth_version).toBe(1);
  });

  it('writes an audit event without recording the password', async () => {
    const rows = await db.query(
      `SELECT action,actor_user_id,target_id,metadata
       FROM audit_logs
       WHERE action='USER_PASSWORD_RESET'`,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].actor_user_id).toBe(1);
    expect(rows[0].target_id).toBe('2');
    expect(rows[0].metadata).not.toContain(
      'Strong-Temporary-Password-2026!',
    );
  });

  it('rejects unauthorized password resets', async () => {
    await expect(
      service.reset(2, 'Another-Secure-Password!', 3),
    ).rejects.toThrow('Insufficient permissions');
  });

  it('blocks ordinary resets for administrator accounts', async () => {
    await expect(
      service.reset(4, 'Another-Secure-Password!', 1),
    ).rejects.toThrow('Administrator password changes');

    await expect(
      service.reset(5, 'Another-Secure-Password!', 1),
    ).rejects.toThrow('Administrator password changes');
  });

  it('blocks password resets for the acting account', async () => {
    await expect(
      service.reset(1, 'Another-Secure-Password!', 1),
    ).rejects.toThrow('self-service password change');
  });

  it('rejects weak passwords and invalid employee IDs', async () => {
    await expect(
      service.reset(2, 'short', 1),
    ).rejects.toThrow('Invalid password reset');

    await expect(
      service.reset(-1, 'Another-Secure-Password!', 1),
    ).rejects.toThrow('Invalid password reset');
  });

  it('rejects unknown target employees', async () => {
    await expect(
      service.reset(9999, 'Another-Secure-Password!', 1),
    ).rejects.toThrow('Employee not found');
  });

  it('rolls back the password if audit insertion fails', async () => {
    const previous = await db.query(
      'SELECT password FROM users WHERE id=2',
    );
    const version = await db.query(
      'SELECT auth_version FROM user_profiles WHERE user_id=2',
    );

    await db.query(
      'DROP TABLE audit_logs',
    );

    await expect(
      service.reset(2, 'Another-Secure-Password!', 1),
    ).rejects.toThrow();

    const current = await db.query(
      'SELECT password FROM users WHERE id=2',
    );
    const currentVersion = await db.query(
      'SELECT auth_version FROM user_profiles WHERE user_id=2',
    );

    expect(current).toEqual(previous);
    expect(currentVersion).toEqual(version);
  });
});
