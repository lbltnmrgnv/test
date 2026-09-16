import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponse } from './models/auth-response.model';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import { User } from '../user/user.model';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user and get auth tokens',
    description:
      'Copy `accessToken` from the response, click **Authorize** in Swagger UI, and paste the token into the `access-token` field.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: AuthResponse })
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login user and get auth tokens',
    description:
      'Use the example credentials (`demo@bookish.test` / `bookish123`). Copy `accessToken` from the response, click **Authorize**, and paste the token into the `access-token` field.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: AuthResponse })
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AuthResponse })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async logout(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.authService.logout(request.accessToken);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, type: User })
  getMe(@Req() request: AuthenticatedRequest): Omit<User, 'passwordHash'> {
    return this.authService.sanitizeUser(request.user);
  }
}
