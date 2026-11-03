import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { EmployeeCreateService } from './employee-create.service';

describe('Employee creation SQLite integration', () => {
  let db: DataSource;
  let service: EmployeeCreateService;
  let actorId: number;

  const input = () => ({
    username: 'new.employee',
    password: 'long-and-unique-test-password',
    fullName: 'New Employee',
    email: 'new.employee@example.test',
    roleCodes: ['PROCUREMENT_OFFICER', 'AUDITOR'],
  });

  beforeAll(async () => {
    db = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [],
    });
    await db.initialize();
    await db.query('PRAGMA foreign_keys = ON');

    await db.query(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )`);

    await db.query(`CREATE TABLE user_profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      full_name TEXT NOT NULL,
      email TEXT UNIQUE COLLATE NOCASE NOT NULL,
      status TEXT NOT NULL
    )`);

    await db.query(`CREATE TABLE roles (
      id INTEGER PRIMARY KEY,
      code TEXT UNIQUE NOT NULL
    )`);

    await db.query(`CREATE TABLE permissions (
      id INTEGER PRIMARY KEY,
      code TEXT UNIQUE NOT NULL
    )`);

    await db.query(`CREATE TABLE user_roles (
      user_id INTEGER NOT NULL REFERENCES users(id),
      role_id INTEGER NOT NULL REFERENCES roles(id),
      PRIMARY KEY(user_id,role_id)
    )`);

    await db.query(`CREATE TABLE role_permissions (
      role_id INTEGER NOT NULL REFERENCES roles(id),
      permission_id INTEGER NOT NULL REFERENCES permissions(id),
      PRIMARY KEY(role_id,permission_id)
    )`);

    await db.query(`CREATE TABLE audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      metadata TEXT
    )`);

    const actor = await db.query(
      `INSERT INTO users(username,password,role)
       VALUES ('admin','unused','Administrator') RETURNING id`,
    );
    actorId = actor[0].id;

    await db.query(
      `INSERT INTO user_profiles
         (user_id,full_name,email,status)
       VALUES (?, 'Test Administrator','admin@example.test','ACTIVE')`,
      [actorId],
    );

    await db.query(`INSERT INTO roles(id,code) VALUES
      (1,'ADMINISTRATOR'),
      (2,'PROCUREMENT_OFFICER'),
      (3,'AUDITOR'),
      (4,'SUPER_ADMIN'),
      (5,'HIGH_PRIVILEGE')`);

    await db.query(
      `INSERT INTO permissions(id,code) VALUES
        (1,'users.create'),
        (2,'users.assign_roles'),
        (3,'users.reset_password')`,
    );
    await db.query(
      'INSERT INTO user_roles(user_id,role_id) VALUES (?,1)',
      [actorId],
    );
    await db.query(
      `INSERT INTO role_permissions(role_id,permission_id)
       VALUES (1,1),(1,2),(5,3)`,
    );

    service = new EmployeeCreateService(db);
  });

  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
  });

  it('creates one employee with hashed password and assigned roles', async () => {
    const result = await service.create(input(), actorId);

    expect(result.username).toBe('new.employee');
    expect(result.roles).toEqual(['AUDITOR', 'PROCUREMENT_OFFICER']);
    expect(JSON.stringify(result)).not.toContain('password');

    const users = await db.query(
      'SELECT password FROM users WHERE id=?',
      [result.id],
    );

    expect(users[0].password).toMatch(/^\$2[aby]\$12\$/);
    expect(await bcrypt.compare(input().password, users[0].password))
      .toBe(true);

    const roleCount = await db.query(
      'SELECT COUNT(*) AS total FROM user_roles WHERE user_id=?',
      [result.id],
    );
    expect(roleCount[0].total).toBe(2);

    const audit = await db.query(
      'SELECT action, metadata FROM audit_logs WHERE target_id=?',
      [String(result.id)],
    );
    expect(audit[0].action).toBe('USER_CREATED');
    expect(audit[0].metadata).not.toContain(input().password);
  });

  it('rejects duplicate usernames and emails', async () => {
    await expect(service.create(input(), actorId))
      .rejects.toThrow('Employee account already exists');

    const duplicateEmail = {
      ...input(),
      username: 'different.employee',
    };
    await expect(service.create(duplicateEmail, actorId))
      .rejects.toThrow('Employee account already exists');
  });

  it('rejects unknown and privileged role codes', async () => {
    await expect(service.create({
      ...input(), username: 'unknown.role',
      email: 'unknown@example.test',
      roleCodes: ['UNKNOWN_ROLE'],
    }, actorId)).rejects.toThrow('Unknown employee role');

    await expect(service.create({
      ...input(), roleCodes: ['SUPER_ADMIN'],
    }, actorId)).rejects.toThrow('Invalid role assignment');
  });

  it('rejects ordinary creation of administrator accounts', async () => {
    await expect(service.create({
      ...input(),
      username: 'new.administrator',
      email: 'new.administrator@example.test',
      roleCodes: ['ADMINISTRATOR'],
    }, actorId)).rejects.toThrow(
      'Only an active Super Admin can create an Administrator',
    );
  });

  it('allows an active Super Admin to create one Administrator', async () => {
    const actor = await db.query(
      `INSERT INTO users(username,password,role)
       VALUES ('super.creator','unused','Administrator') RETURNING id`,
    );
    const superId = Number(actor[0].id);

    await db.query(
      `INSERT INTO user_profiles(user_id,full_name,email,status)
       VALUES (?, 'Super Creator','super.creator@example.test','ACTIVE')`,
      [superId],
    );
    await db.query(
      'INSERT INTO user_roles(user_id,role_id) VALUES (?,4)',
      [superId],
    );
    await db.query(
      `INSERT INTO role_permissions(role_id,permission_id)
       VALUES (4,1),(4,2)`,
    );

    const created = await service.create({
      ...input(),
      username: 'created.administrator',
      email: 'created.administrator@example.test',
      roleCodes: ['ADMINISTRATOR'],
    }, superId);

    expect(created.roles).toEqual(['ADMINISTRATOR']);
    expect(JSON.stringify(created)).not.toContain('password');

    const assigned = await db.query(
      `SELECT r.code FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [created.id],
    );
    expect(assigned.map(row => row.code)).toEqual(['ADMINISTRATOR']);

    await expect(service.create({
      ...input(),
      username: 'mixed.administrator',
      email: 'mixed.administrator@example.test',
      roleCodes: ['ADMINISTRATOR', 'AUDITOR'],
    }, superId)).rejects.toThrow('Invalid role assignment');
  });

  it('blocks roles containing permissions the creator lacks', async () => {
    const before = await db.query(
      'SELECT COUNT(*) AS total FROM users',
    );

    await expect(service.create({
      ...input(),
      username: 'escalation.attempt',
      email: 'escalation@example.test',
      roleCodes: ['HIGH_PRIVILEGE'],
    }, actorId)).rejects.toThrow(
      'Cannot create employees with permissions you do not possess',
    );

    const after = await db.query(
      'SELECT COUNT(*) AS total FROM users',
    );

    expect(after[0].total).toBe(before[0].total);
  });

  it('permits an authorized creator to grant a matching role', async () => {
    await db.query(
      'INSERT INTO role_permissions(role_id,permission_id) VALUES (1,3)',
    );

    try {
      const created = await service.create({
        ...input(),
        username: 'permitted.employee',
        email: 'permitted.employee@example.test',
        roleCodes: ['HIGH_PRIVILEGE'],
      }, actorId);

      expect(created.roles).toEqual(['HIGH_PRIVILEGE']);
    } finally {
      await db.query(
        'DELETE FROM role_permissions WHERE role_id=1 AND permission_id=3',
      );
    }
  });

  it('denies creation by users without users.create', async () => {
    await expect(service.create({
      ...input(),
      username: 'unauthorized.employee',
      email: 'unauthorized@example.test',
    }, 9999)).rejects.toThrow('Administrator not authorized');
  });

  it('rejects weak passwords and duplicate roles', async () => {
    await expect(service.create({
      ...input(), password: 'short',
    }, actorId)).rejects.toThrow('Invalid employee details');

    await expect(service.create({
      ...input(), roleCodes: ['AUDITOR', 'AUDITOR'],
    }, actorId)).rejects.toThrow('Invalid role assignment');
  });

  it('does not leave a partial account when an insert fails', async () => {
    const before = await db.query(
      'SELECT COUNT(*) AS total FROM users',
    );

    await expect(service.create({
      ...input(),
      username: 'new.employee',
      email: 'other@example.test',
    }, actorId)).rejects.toThrow();

    const after = await db.query(
      'SELECT COUNT(*) AS total FROM users',
    );

    expect(after[0].total).toBe(before[0].total);
  });
  it('denies creation if actor lacks role-assignment privilege', async () => {
    await db.query(
      'DELETE FROM role_permissions WHERE role_id=1 AND permission_id=2',
    );

    try {
      await expect(service.create({
        ...input(),
        username: 'restricted.employee',
        email: 'restricted@example.test',
      }, actorId)).rejects.toThrow('Administrator not authorized');
    } finally {
      await db.query(
        'INSERT INTO role_permissions(role_id,permission_id) VALUES (1,2)',
      );
    }
  });

});
