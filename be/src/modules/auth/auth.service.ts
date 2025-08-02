import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  requires2FA?: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    return this.usersService.create(registerDto);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.is2faEnabled) {
      // Return minimal response for 2FA challenge
      return {
        access_token: null,
        refresh_token: null,
        user: null,
        requires2FA: true,
      };
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await this.usersService.validatePassword(user, password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async generate2FASecret(user: User): Promise<TwoFactorSetup> {
    const secret = speakeasy.generateSecret({
      name: `DevChat (${user.email})`,
      issuer: 'DevChat',
    });

    // Save the secret to the user
    await this.usersService.update2FASecret(user.id, secret.base32);

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async verify2FA(user: User, token: string): Promise<boolean> {
    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA is not set up for this user');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 time step tolerance
    });

    return verified;
  }

  async enable2FA(user: User, token: string): Promise<AuthResponse> {
    const isValid = await this.verify2FA(user, token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    await this.usersService.enable2FA(user.id);

    // Re-fetch user to get updated 2FA status
    const updatedUser = await this.usersService.findOne(user.id);

    return this.generateTokens(updatedUser);
  }

  async disable2FA(user: User): Promise<void> {
    await this.usersService.disable2FA(user.id);
  }

  async loginWith2FA(email: string, password: string, token: string): Promise<AuthResponse> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is2faEnabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    const isValid = await this.verify2FA(user, token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    return this.generateTokens(user);
  }

  private async generateTokens(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const user = await this.usersService.findOne(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
