import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';

import type { ConfigurationRoot } from '../config/configuration.types.js';
import { PrismaService } from '../database/prisma.service.js';
import { InvalidCredentialsException, LoginRateLimitException } from './auth.exceptions.js';
import { PasswordHasher } from './password-hasher.js';
import type { AuthContext } from './auth.types.js';
import type { AuthRole } from './roles.js';
import type { LoginDto } from './dto/auth.dto.js';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const ACCOUNT_LOCK_THRESHOLD = 5;
const ACCOUNT_LOCK_MS = 15 * 60 * 1000;
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$VjFqHTYnoIpDT-VHZccvKA$XpsgpkUMqLhugD-oMe7S2xWn76ZWcNbLXim5Eqz83yU';

interface AttemptWindow {
  count: number;
  startedAt: number;
}

export interface LoginResult {
  readonly token: string;
  readonly csrfToken: string;
  readonly session: AuthSessionResponse;
}

export interface PublicAuthenticatedUser {
  readonly id: string;
  readonly organizationId: string;
  readonly siteId: string | null;
  readonly email: string;
  readonly fullName: string;
  readonly role: AuthRole;
}

export interface AuthSessionResponse {
  readonly user: PublicAuthenticatedUser;
  readonly expiresAt: string;
}

function sessionTokenHash(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function publicUser(user: {
  id: string;
  organizationId: string;
  siteId: string | null;
  email: string;
  fullName: string;
  role: AuthRole;
}): PublicAuthenticatedUser {
  return {
    id: user.id,
    organizationId: user.organizationId,
    siteId: user.siteId,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}

@Injectable()
export class AuthService {
  private readonly attempts = new Map<string, AttemptWindow>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasher,
    private readonly config: ConfigService<ConfigurationRoot>,
  ) {}

  async login(dto: LoginDto, source: string): Promise<LoginResult> {
    const email = dto.email.trim().toLowerCase();
    const attemptKey = `${source}:${dto.organizationId}:${email}`;
    if (!this.allowAttempt(attemptKey)) throw new LoginRateLimitException();

    const user = await this.prisma.user.findFirst({
      where: { organizationId: dto.organizationId, email },
      select: {
        id: true,
        organizationId: true,
        siteId: true,
        email: true,
        fullName: true,
        role: true,
        active: true,
        passwordHash: true,
        failedLoginAttempts: true,
        lastFailedLoginAt: true,
        lockedUntil: true,
        organization: { select: { active: true } },
        site: { select: { active: true } },
      },
    });

    const now = new Date();
    const passwordMatches = await this.hasher.verify(
      dto.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    const usable =
      user !== null &&
      user.active &&
      user.organization.active &&
      (user.site === null || user.site.active) &&
      (user.lockedUntil === null || user.lockedUntil <= now);

    if (!passwordMatches || !usable) {
      if (user !== null && user.active && user.organization.active) {
        await this.registerFailure(user.id, user.failedLoginAttempts, user.lastFailedLoginAt, now);
      }
      throw new InvalidCredentialsException();
    }

    const token = randomBytes(32).toString('hex');
    const csrfToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      now.getTime() + this.config.getOrThrow('app').sessionTtlSeconds * 1000,
    );
    const session = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lastFailedLoginAt: null, lockedUntil: null },
      });
      return tx.authSession.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          tokenHash: sessionTokenHash(token),
          expiresAt,
        },
        select: { expiresAt: true },
      });
    });
    this.attempts.delete(attemptKey);

    return {
      token,
      csrfToken,
      session: { user: publicUser(user), expiresAt: session.expiresAt.toISOString() },
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  sessionResponse(context: AuthContext): AuthSessionResponse {
    return {
      user: {
        id: context.userId,
        organizationId: context.organizationId,
        siteId: context.siteId,
        email: context.email,
        fullName: context.fullName,
        role: context.role,
      },
      expiresAt: context.sessionExpiresAt.toISOString(),
    };
  }

  private allowAttempt(key: string): boolean {
    const now = Date.now();
    if (this.attempts.size > 10_000) {
      for (const [candidate, window] of this.attempts) {
        if (now - window.startedAt >= LOGIN_WINDOW_MS) this.attempts.delete(candidate);
      }
    }
    const current = this.attempts.get(key);
    if (current === undefined || now - current.startedAt >= LOGIN_WINDOW_MS) {
      this.attempts.set(key, { count: 1, startedAt: now });
      return true;
    }
    if (current.count >= MAX_LOGIN_ATTEMPTS) return false;
    current.count += 1;
    return true;
  }

  private async registerFailure(
    userId: string,
    attempts: number,
    lastFailedAt: Date | null,
    now: Date,
  ): Promise<void> {
    const withinWindow =
      lastFailedAt !== null && now.getTime() - lastFailedAt.getTime() < LOGIN_WINDOW_MS;
    const nextAttempts = withinWindow ? attempts + 1 : 1;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: nextAttempts,
        lastFailedLoginAt: now,
        lockedUntil:
          nextAttempts >= ACCOUNT_LOCK_THRESHOLD ? new Date(now.getTime() + ACCOUNT_LOCK_MS) : null,
      },
    });
  }
}
