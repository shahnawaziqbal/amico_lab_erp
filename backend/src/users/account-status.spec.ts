import { UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { JwtStrategy } from './jwt.strategy';
import * as bcrypt from 'bcrypt';

describe('Account status enforcement', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const account = {
    id: 4,
    username: 'employee',
    password: '',
    role: 'Administrator',
  } as User;

  it('allows active accounts to authenticate', async () => {
    const hash = await bcrypt.hash('valid-test-password', 4);
    const usersRepo = {
      findOne: jest.fn().mockResolvedValue({
        ...account,
        password: hash,
      }),
    };
    const dataSource = {
      query: jest.fn().mockImplementation(async (sql: string) =>
        sql.includes('SELECT auth_version')
          ? [{ auth_version: 0 }]
          : [{ user_id: 4 }],
      ),
    };
    const jwt = { signAsync: jest.fn().mockResolvedValue('test-token') };

    const service = new UsersService(
      usersRepo as unknown as Repository<User>,
      jwt as unknown as JwtService,
      dataSource as unknown as DataSource,
    );

    const user = await service.validateUser(
      'employee',
      'valid-test-password',
    );
    expect(user.id).toBe(4);
    expect((await service.login(user)).access_token).toBe('test-token');
    expect(jwt.signAsync).toHaveBeenCalledTimes(1);
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: 4,
      username: 'employee',
      authVersion: 0,
    });
  });

  it('denies suspended, inactive and missing profiles at login', async () => {
    const hash = await bcrypt.hash('valid-test-password', 4);

    for (const rows of [[], [], []]) {
      const usersRepo = {
        findOne: jest.fn().mockResolvedValue({
          ...account,
          password: hash,
        }),
      };
      const dataSource = {
        query: jest.fn().mockResolvedValue(rows),
      };
      const jwt = { signAsync: jest.fn() };

      const service = new UsersService(
        usersRepo as unknown as Repository<User>,
        jwt as unknown as JwtService,
        dataSource as unknown as DataSource,
      );

      await expect(
        service.validateUser('employee', 'valid-test-password'),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwt.signAsync).not.toHaveBeenCalled();
    }
  });

  it('refuses to issue a token when status changes after validation', async () => {
    const jwt = { signAsync: jest.fn() };
    const service = new UsersService(
      {} as Repository<User>,
      jwt as unknown as JwtService,
      { query: jest.fn().mockResolvedValue([]) } as unknown as DataSource,
    );

    await expect(service.login(account))
      .rejects.toThrow(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('validates active identity on every JWT-authenticated request', async () => {
    process.env.JWT_SECRET = 'temporary-unit-test-secret-with-adequate-length';
    const query = jest.fn().mockResolvedValue([{ id: 4 }]);
    const strategy = new JwtStrategy(
      { query } as unknown as DataSource,
    );

    await expect(strategy.validate({
      sub: 4,
      username: 'employee',
      authVersion: 0,
    })).resolves.toEqual({
      userId: 4,
      username: 'employee',
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("up.status = 'ACTIVE'"),
      [4, 'employee', 0],
    );
  });

  it('rejects JWTs for suspended or deleted accounts', async () => {
    process.env.JWT_SECRET = 'temporary-unit-test-secret-with-adequate-length';
    const strategy = new JwtStrategy({
      query: jest.fn().mockResolvedValue([]),
    } as unknown as DataSource);

    await expect(strategy.validate({
      sub: 4,
      username: 'employee',
      authVersion: 0,
    })).rejects.toThrow(UnauthorizedException);
  });

  it('rejects JWTs without a version claim', async () => {
    process.env.JWT_SECRET = 'temporary-unit-test-secret-with-adequate-length';
    const query = jest.fn();
    const strategy = new JwtStrategy(
      { query } as unknown as DataSource,
    );

    await expect(strategy.validate({
      sub: 4,
      username: 'employee',
    } as any)).rejects.toThrow(UnauthorizedException);

    expect(query).not.toHaveBeenCalled();
  });

  it('rejects JWTs issued before an account version change', async () => {
    process.env.JWT_SECRET = 'temporary-unit-test-secret-with-adequate-length';

    const query = jest.fn().mockImplementation(
      async (_sql: string, parameters: unknown[]) =>
        parameters[2] === 2 ? [{ id: 4 }] : [],
    );

    const strategy = new JwtStrategy(
      { query } as unknown as DataSource,
    );

    await expect(strategy.validate({
      sub: 4,
      username: 'employee',
      authVersion: 1,
    })).rejects.toThrow(UnauthorizedException);

    await expect(strategy.validate({
      sub: 4,
      username: 'employee',
      authVersion: 2,
    })).resolves.toEqual({
      userId: 4,
      username: 'employee',
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('up.auth_version = ?'),
      [4, 'employee', 2],
    );
  });

  it('rejects malformed JWT identities without querying the database', async () => {
    process.env.JWT_SECRET = 'temporary-unit-test-secret-with-adequate-length';
    const query = jest.fn();
    const strategy = new JwtStrategy(
      { query } as unknown as DataSource,
    );

    await expect(strategy.validate({
      sub: -1,
      username: 'employee',
    })).rejects.toThrow(UnauthorizedException);

    expect(query).not.toHaveBeenCalled();
  });
});
