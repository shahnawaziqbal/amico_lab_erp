import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  private async isActiveAccount(userId: number): Promise<boolean> {
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return false;
    }

    const rows: Array<{ user_id: number }> = await this.dataSource.query(
      `SELECT user_id
       FROM user_profiles
       WHERE user_id = ? AND status = 'ACTIVE'
       LIMIT 1`,
      [userId],
    );

    return rows.length === 1;
  }

  async findByUsername(username: string): Promise<User | null> {
    const normalized = username?.trim();
    if (!normalized) return null;

    return this.usersRepo.findOne({
      where: { username: normalized },
    });
  }

  async validateUser(username: string, password: string): Promise<User> {
    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      !password ||
      username.length > 254 ||
      password.length > 1024
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.findByUsername(username);

    // Legacy plaintext passwords are deliberately not accepted.
    if (!user || !/^\$2[aby]\$\d{2}\$/.test(user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!(await this.isActiveAccount(user.id))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: User) {
    if (!(await this.isActiveAccount(user.id))) {
      throw new UnauthorizedException('Invalid credentials');
    }


    const versions: Array<{ auth_version: number }> =
      await this.dataSource.query(
        `SELECT auth_version
         FROM user_profiles
         WHERE user_id = ? AND status = 'ACTIVE'
         LIMIT 1`,
        [user.id],
      );

    if (
      versions.length !== 1 ||
      !Number.isSafeInteger(versions[0].auth_version) ||
      versions[0].auth_version < 0
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      authVersion: versions[0].auth_version,
    });

    return {
      access_token,
      token_type: 'Bearer',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }
}
