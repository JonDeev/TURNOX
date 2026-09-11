import { createHash } from 'node:crypto';

import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { Response } from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module.js';
import { configureApplication } from '../app.factory.js';
import { PrismaService } from '../database/prisma.service.js';
import { PasswordHasher } from './password-hasher.js';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';
if (runIntegration && process.env.DATABASE_URL === undefined) {
  throw new Error('DATABASE_URL is required when RUN_INTEGRATION_TESTS=true');
}
const integration = runIntegration ? describe : describe.skip;

interface Fixture {
  organizationId: string;
  siteAId: string;
  siteBId: string;
  otherOrganizationId: string;
  adminId: string;
  supervisorId: string;
  siteSupervisorId: string;
  advisorId: string;
  inactiveId: string;
}

function cookieValue(response: Response, name: string): string {
  const rawCookies = response.headers['set-cookie'];
  const cookies: readonly string[] = Array.isArray(rawCookies)
    ? rawCookies
    : rawCookies === undefined
      ? []
      : [rawCookies];
  const cookie = cookies.find((candidate) => candidate.startsWith(`${name}=`));
  const value = cookie?.split(';', 1)[0]?.slice(name.length + 1);
  if (value === undefined) throw new Error(`Cookie ${name} not found`);
  return value;
}

function sessionHash(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

integration('web authentication, RBAC and scopes against PostgreSQL', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let hasher: PasswordHasher;
  let fixture: Fixture;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    configureApplication(app);
    await app.init();
    prisma = app.get(PrismaService);
    hasher = app.get(PasswordHasher);

    const organization = await prisma.organization.create({ data: { name: 'Auth Org' } });
    const otherOrganization = await prisma.organization.create({
      data: { name: 'Other Auth Org' },
    });
    const siteA = await prisma.site.create({
      data: { organizationId: organization.id, name: 'Auth Site A' },
    });
    const siteB = await prisma.site.create({
      data: { organizationId: organization.id, name: 'Auth Site B' },
    });
    const passwordHash = await hasher.hash('correct-password');
    const [admin, supervisor, siteSupervisor, advisor, inactive] = await Promise.all([
      prisma.user.create({
        data: {
          organizationId: organization.id,
          email: 'admin-auth@example.test',
          fullName: 'Auth Admin',
          role: 'ADMINISTRADOR',
          passwordHash,
        },
      }),
      prisma.user.create({
        data: {
          organizationId: organization.id,
          email: 'supervisor-auth@example.test',
          fullName: 'Auth Supervisor',
          role: 'SUPERVISOR',
          passwordHash,
        },
      }),
      prisma.user.create({
        data: {
          organizationId: organization.id,
          siteId: siteA.id,
          email: 'site-supervisor-auth@example.test',
          fullName: 'Site Supervisor',
          role: 'SUPERVISOR',
          passwordHash,
        },
      }),
      prisma.user.create({
        data: {
          organizationId: organization.id,
          siteId: siteA.id,
          email: 'advisor-auth@example.test',
          fullName: 'Auth Advisor',
          role: 'ASESOR',
          passwordHash,
        },
      }),
      prisma.user.create({
        data: {
          organizationId: organization.id,
          email: 'inactive-auth@example.test',
          fullName: 'Inactive Auth User',
          role: 'ADMINISTRADOR',
          passwordHash,
          active: false,
        },
      }),
    ]);
    fixture = {
      organizationId: organization.id,
      siteAId: siteA.id,
      siteBId: siteB.id,
      otherOrganizationId: otherOrganization.id,
      adminId: admin.id,
      supervisorId: supervisor.id,
      siteSupervisorId: siteSupervisor.id,
      advisorId: advisor.id,
      inactiveId: inactive.id,
    };
  });

  afterAll(async () => {
    if (prisma !== undefined && fixture !== undefined) {
      await prisma.adminAuditLog.deleteMany({ where: { organizationId: fixture.organizationId } });
      await prisma.authSession.deleteMany({ where: { organizationId: fixture.organizationId } });
      await prisma.user.deleteMany({ where: { organizationId: fixture.organizationId } });
      await prisma.site.deleteMany({ where: { organizationId: fixture.organizationId } });
      await prisma.organization.deleteMany({
        where: { id: { in: [fixture.organizationId, fixture.otherOrganizationId] } },
      });
    }
    await app?.close();
  });

  async function login(
    email: string,
  ): Promise<{ agent: ReturnType<typeof request.agent>; csrfToken: string; response: Response }> {
    const agent = request.agent(app.getHttpServer());
    const response = await agent
      .post('/auth/login')
      .send({ organizationId: fixture.organizationId, email, password: 'correct-password' })
      .expect(200);
    return { agent, csrfToken: cookieValue(response, 'turnox_csrf'), response };
  }

  it('logs in, returns only the public identity and sets safe cookies', async () => {
    const result = await login('admin-auth@example.test');
    expect(result.response.body).toMatchObject({
      user: { id: fixture.adminId, organizationId: fixture.organizationId, role: 'ADMINISTRADOR' },
    });
    expect(JSON.stringify(result.response.body)).not.toMatch(/password|hash|token|secret/iu);
    expect(result.response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/turnox_session=.*; Path=\/; Expires=.*; HttpOnly; SameSite=Lax/),
        expect.stringMatching(/turnox_csrf=.*; Path=\/; Expires=.*; SameSite=Lax/),
      ]),
    );
    const sessionToken = cookieValue(result.response, 'turnox_session');
    const session = await prisma.authSession.findUnique({
      where: { tokenHash: sessionHash(sessionToken) },
    });
    expect(session).not.toBeNull();
    expect(session?.tokenHash).not.toBe(sessionToken);
    expect((await result.agent.get('/auth/me').expect(200)).body.user).toMatchObject({
      id: fixture.adminId,
    });
  });

  it('rejects invalid and unknown credentials uniformly, including inactive users', async () => {
    const invalid = await request(app.getHttpServer()).post('/auth/login').send({
      organizationId: fixture.organizationId,
      email: 'admin-auth@example.test',
      password: 'wrong-password',
    });
    const unknown = await request(app.getHttpServer()).post('/auth/login').send({
      organizationId: fixture.organizationId,
      email: 'missing-auth@example.test',
      password: 'wrong-password',
    });
    const inactive = await request(app.getHttpServer()).post('/auth/login').send({
      organizationId: fixture.organizationId,
      email: 'inactive-auth@example.test',
      password: 'correct-password',
    });
    expect(invalid.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(inactive.status).toBe(401);
    expect(invalid.body.code).toBe('INVALID_CREDENTIALS');
    expect(unknown.body.code).toBe('INVALID_CREDENTIALS');
    expect(inactive.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('requires authentication and applies RBAC, organization and site scope', async () => {
    await request(app.getHttpServer())
      .get(`/organizations/${fixture.organizationId}/sites`)
      .expect(401);

    const supervisor = await login('supervisor-auth@example.test');
    await supervisor.agent.get(`/organizations/${fixture.organizationId}/sites`).expect(200);
    await supervisor.agent
      .post(`/organizations/${fixture.organizationId}/sites`)
      .set('X-CSRF-Token', supervisor.csrfToken)
      .send({ name: 'Supervisor Cannot Create' })
      .expect(403);
    await supervisor.agent.get(`/organizations/${fixture.otherOrganizationId}/sites`).expect(403);

    const siteSupervisor = await login('site-supervisor-auth@example.test');
    const sites = await siteSupervisor.agent
      .get(`/organizations/${fixture.organizationId}/sites`)
      .expect(200);
    expect(sites.body.items).toHaveLength(1);
    expect(sites.body.items[0].id).toBe(fixture.siteAId);
    await siteSupervisor.agent
      .get(`/organizations/${fixture.organizationId}/sites/${fixture.siteBId}`)
      .expect(403);

    const advisor = await login('advisor-auth@example.test');
    await advisor.agent.get(`/organizations/${fixture.organizationId}/sites`).expect(403);
  });

  it('protects mutations with CSRF and records the authenticated actor', async () => {
    const admin = await login('admin-auth@example.test');
    await admin.agent
      .patch(`/organizations/${fixture.organizationId}/sites/${fixture.siteBId}`)
      .send({ name: 'Blocked Without CSRF' })
      .expect(403);
    await admin.agent
      .patch(`/organizations/${fixture.organizationId}/sites/${fixture.siteBId}`)
      .set('X-CSRF-Token', admin.csrfToken)
      .set('X-Correlation-Id', 'auth-audit-test')
      .send({ name: 'Scoped Site Updated' })
      .expect(200);
    const audit = await prisma.adminAuditLog.findFirst({
      where: {
        organizationId: fixture.organizationId,
        resourceId: fixture.siteBId,
        action: 'UPDATE',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toMatchObject({
      actorUserId: fixture.adminId,
      actorType: 'USER',
      correlationId: 'auth-audit-test',
    });
  });

  it('revokes and expires server-side sessions', async () => {
    const logout = await login('admin-auth@example.test');
    const sessionToken = cookieValue(logout.response, 'turnox_session');
    const session = await prisma.authSession.findUniqueOrThrow({
      where: { tokenHash: sessionHash(sessionToken) },
    });
    await logout.agent.post('/auth/logout').set('X-CSRF-Token', logout.csrfToken).expect(200);
    expect(
      (await prisma.authSession.findUniqueOrThrow({ where: { id: session.id } })).revokedAt,
    ).not.toBeNull();
    await logout.agent.get('/auth/me').expect(401);

    const expired = await login('admin-auth@example.test');
    const expiredToken = cookieValue(expired.response, 'turnox_session');
    const expiredSession = await prisma.authSession.findUniqueOrThrow({
      where: { tokenHash: sessionHash(expiredToken) },
    });
    await prisma.authSession.update({
      where: { id: expiredSession.id },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    await expired.agent.get('/auth/me').expect(401);
  });
});
