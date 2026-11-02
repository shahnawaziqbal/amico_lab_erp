import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('auth')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('login')
  async login(@Body() body: { username: string; pass: string }) {
    return this.usersService.validateUser(body.username, body.pass);
  }
}