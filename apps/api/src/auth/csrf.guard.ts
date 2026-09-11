import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

import type { ConfigurationRoot } from '../config/configuration.types.js';
import { AuthorizationDeniedException } from './auth.exceptions.js';
import { readCookie } from './cookie.util.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly config: ConfigService<ConfigurationRoot>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (SAFE_METHODS.has(request.method)) return true;

    const configuration = this.config.getOrThrow('app');
    const cookie = readCookie(request, configuration.csrfCookieName);
    const header = request.header('x-csrf-token');
    if (
      cookie === undefined ||
      header === undefined ||
      !/^[a-f0-9]{64}$/u.test(cookie) ||
      !/^[a-f0-9]{64}$/u.test(header) ||
      !timingSafeEqual(Buffer.from(cookie), Buffer.from(header))
    ) {
      throw new AuthorizationDeniedException();
    }
    return true;
  }
}
