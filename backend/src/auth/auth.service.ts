import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashed,
        role: dto.role,
      },
    });

    if (user.role === UserRole.HANDYMAN) {
      await this.prisma.handymanProfile.create({
        data: { userId: user.id, skills: [] },
      });
    }

    const accessToken = this.signAccess(user.id, user.role);
    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException();

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException();

    const accessToken = this.signAccess(user.id, user.role);
    const refreshToken = this.signRefresh(user.id);
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
      return { accessToken: this.signAccess(user.id, user.role) };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, token: string) {
    const decoded = this.jwtService.decode(token) as { exp: number };
    await this.prisma.tokenBlocklist.create({
      data: {
        token,
        userId,
        expiresAt: new Date(decoded.exp * 1000),
      },
    });
  }

  private signAccess(userId: string, role: UserRole) {
    return this.jwtService.sign(
      { sub: userId, role },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN') ?? '15m',
      },
    );
  }

  private signRefresh(userId: string) {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      },
    );
  }
}
