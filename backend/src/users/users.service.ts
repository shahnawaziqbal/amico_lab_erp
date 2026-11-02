import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    if (!username) return null;
    return await this.usersRepo.findOne({ where: { username } });
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.findByUsername(username);
    if (user && (user as any).password === pass) {
      const { password, ...result } = user as any;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}