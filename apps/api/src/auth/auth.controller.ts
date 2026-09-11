import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { randomBytes } from 'node:crypto';

import type { ConfigurationRoot } from '../config/configuration.types.js';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import type { AuthSessionResponse } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { CsrfGuard } from './csrf.guard.js';
import { CurrentUser } from './auth.decorators.js';
import type { AuthenticatedRequest, AuthContext } from './auth.types.js';
import { LoginDto } from './dto/auth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<ConfigurationRoot>,
  ) {}

  @Get('csrf')
  csrf(@Res({ passthrough: true }) response: Response): { status: 'ok' } {
    this.setCsrfCookie(response, randomBytes(32).toString('hex'));
    return { status: 'ok' };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponse> {
    const result = await this.auth.login(dto, request.ip ?? 'unknown');
    this.setSessionCookie(response, result.token);
    this.setCsrfCookie(response, result.csrfToken);
    return result.session;
  }

  @UseGuards(AuthGuard, CsrfGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() context: AuthContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ status: 'ok' }> {
    await this.auth.logout(context.sessionId);
    const configuration = this.config.getOrThrow('app');
    response.clearCookie(configuration.authCookieName, {
      httpOnly: true,
      path: configuration.authCookiePath,
      sameSite: configuration.authCookieSameSite,
      secure: configuration.authCookieSecure,
    });
    response.clearCookie(configuration.csrfCookieName, {
      path: '/',
      sameSite: configuration.authCookieSameSite,
      secure: configuration.authCookieSecure,
    });
    return { status: 'ok' };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() context: AuthContext): AuthSessionResponse {
    return this.auth.sessionResponse(context);
  }

  private setSessionCookie(response: Response, token: string): void {
    const configuration = this.config.getOrThrow('app');
    response.cookie(configuration.authCookieName, token, {
      httpOnly: true,
      maxAge: configuration.sessionTtlSeconds * 1000,
      path: configuration.authCookiePath,
      sameSite: configuration.authCookieSameSite,
      secure: configuration.authCookieSecure,
    });
  }

  private setCsrfCookie(response: Response, token: string): void {
    const configuration = this.config.getOrThrow('app');
    response.cookie(configuration.csrfCookieName, token, {
      httpOnly: false,
      maxAge: configuration.sessionTtlSeconds * 1000,
      path: '/',
      sameSite: configuration.authCookieSameSite,
      secure: configuration.authCookieSecure,
    });
  }
}
