import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

import type { ConfigurationRoot } from '../config/configuration.types.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthenticationRequiredException } from './auth.exceptions.js';
import { readCookie } from './cookie.util.js';
import type { AuthenticatedRequest, AuthContext } from './auth.types.js';

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<ConfigurationRoot>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readCookie(request, this.config.getOrThrow('app').authCookieName);
    if (token === undefined || !/^[a-f0-9]{64}$/u.test(token)) {
      throw new AuthenticationRequiredException();
    }

    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      select: {
        id: true,
        organizationId: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            organizationId: true,
            siteId: true,
            email: true,
            fullName: true,
            role: true,
            active: true,
            organization: { select: { active: true } },
            site: { select: { active: true } },
          },
        },
      },
    });
    const now = new Date();
    if (
      session === null ||
      session.revokedAt !== null ||
      session.expiresAt <= now ||
      !session.user.active ||
      !session.user.organization.active ||
      (session.user.site !== null && !session.user.site.active)
    ) {
      throw new AuthenticationRequiredException();
    }

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { lastSeenAt: now },
    });
    const authContext: AuthContext = {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      siteId: session.user.siteId,
      role: session.user.role,
      email: session.user.email,
      fullName: session.user.fullName,
      sessionId: session.id,
      sessionExpiresAt: session.expiresAt,
    };
    request.authContext = authContext;
    return true;
  }
}
