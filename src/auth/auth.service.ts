import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Password match is already validated by DTO decorator
    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
    });

    const payload = { sub: user.id, email: user.email };
    return {
      message: 'Registration successful! Welcome to LiveBid.',
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        balance: user.balance,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      message: 'Login successful! Welcome back.',
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        balance: user.balance,
      },
    };
  }
}

