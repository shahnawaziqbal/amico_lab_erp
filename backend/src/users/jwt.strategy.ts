import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { DataSource } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from './users.module';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly dataSource: DataSource) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: {
    sub: number;
    username: string;
    authVersion: number;
  }) {
    if (
      !payload ||
      !Number.isSafeInteger(payload.sub) ||
      payload.sub <= 0 ||
      typeof payload.username !== 'string' ||
      !payload.username ||
      !Number.isSafeInteger(payload.authVersion) ||
      payload.authVersion < 0
    ) {
      throw new UnauthorizedException();
    }

    const rows: Array<{ id: number }> = await this.dataSource.query(
      `SELECT u.id
       FROM users u
       INNER JOIN user_profiles up ON up.user_id = u.id
       WHERE u.id = ?
         AND u.username = ?
         AND up.status = 'ACTIVE'
          AND up.auth_version = ?
       LIMIT 1`,
      [payload.sub, payload.username, payload.authVersion],
    );

    if (rows.length !== 1) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      username: payload.username,
    };
  }
}
