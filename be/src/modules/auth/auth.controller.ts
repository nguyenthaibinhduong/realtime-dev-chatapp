import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, AuthResponse, TwoFactorSetup } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Authentication')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: User })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<User> {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  @ApiResponse({ status: 200, description: '2FA setup initiated successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async generate2FA(@GetUser() user: User): Promise<TwoFactorSetup> {
    return this.authService.generate2FASecret(user);
  }

  @ApiOperation({ summary: 'Verify and enable 2FA' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 401, description: 'Invalid 2FA token' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('2fa/verify')
  async verify2FA(
    @GetUser() user: User,
    @Body() verify2FADto: Verify2FADto,
  ): Promise<AuthResponse> {
    return this.authService.enable2FA(user, verify2FADto.token);
  }

  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('2fa/disable')
  async disable2FA(@GetUser() user: User): Promise<{ message: string }> {
    await this.authService.disable2FA(user);
    return { message: '2FA disabled successfully' };
  }

  @ApiOperation({ summary: 'Login with 2FA' })
  @ApiResponse({ status: 200, description: 'User logged in successfully with 2FA' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or 2FA token' })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login/2fa')
  async loginWith2FA(@Body() body: LoginDto & Verify2FADto): Promise<AuthResponse> {
    return this.authService.loginWith2FA(body.email, body.password, body.token);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshToken(@Body() body: { refresh_token: string }): Promise<AuthResponse> {
    return this.authService.refreshTokens(body.refresh_token);
  }
}
