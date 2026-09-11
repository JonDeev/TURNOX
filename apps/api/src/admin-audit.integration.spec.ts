import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { Response } from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AppModule } from './app.module.js';
import { configureApplication } from './app.factory.js';
import { PasswordHasher } from './auth/password-hasher.js';
import { AdminAuditService } from './audit/audit.service.js';
import { PrismaService } from './database/prisma.service.js';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';
if (runIntegration && process.env.DATABASE_URL === undefined) {
  throw new Error('DATABASE_URL is required when RUN_INTEGRATION_TESTS=true');
}
const integration = runIntegration ? describe : describe.skip;

function cookieValue(response: Response, name: string): string {
  const cookies = response.headers['set-cookie'];
  const values = Array.isArray(cookies) ? cookies : cookies === undefined ? [] : [cookies];
  const cookie = values.find((candidate) => candidate.startsWith(`${name}=`));
  const value = cookie?.split(';', 1)[0]?.slice(name.length + 1);
  if (value === undefined) throw new Error(`Cookie ${name} not found`);
  return value;
}

integration('authenticated administrative audit against PostgreSQL', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let audit: AdminAuditService;
  let organizationId: string;
  let actorUserId: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    configureApplication(app);
    await app.init();
    prisma = app.get(PrismaService);
    audit = app.get(AdminAuditService);
    const hasher = app.get(PasswordHasher);
    const organization = await prisma.organization.create({ data: { name: 'Audit Auth Org' } });
    organizationId = organization.id;
    const user = await prisma.user.create({
      data: {
        organizationId,
        email: 'audit-auth@example.test',
        fullName: 'Audit Actor',
        role: 'ADMINISTRADOR',
        passwordHash: await hasher.hash('correct-password'),
      },
    });
    actorUserId = user.id;
  });

  afterAll(async () => {
    if (prisma !== undefined && organizationId !== undefined) {
      await prisma.adminAuditLog.deleteMany({ where: { organizationId } });
      await prisma.authSession.deleteMany({ where: { organizationId } });
      await prisma.serviceAssignment.deleteMany({ where: { organizationId } });
      await prisma.device.deleteMany({ where: { organizationId } });
      await prisma.counter.deleteMany({ where: { organizationId } });
      await prisma.room.deleteMany({ where: { organizationId } });
      await prisma.service.deleteMany({ where: { organizationId } });
      await prisma.user.deleteMany({ where: { organizationId } });
      await prisma.site.deleteMany({ where: { organizationId } });
      await prisma.organization.delete({ where: { id: organizationId } });
    }
    await app?.close();
  });

  async function authenticatedAgent() {
    const agent = request.agent(app.getHttpServer());
    const login = await agent.post('/auth/login').send({
      organizationId,
      email: 'audit-auth@example.test',
      password: 'correct-password',
    });
    return { agent, csrfToken: cookieValue(login, 'turnox_csrf') };
  }

  it('records the authenticated actor for administrative mutations', async () => {
    const { agent, csrfToken } = await authenticatedAgent();
    const siteResponse = await agent
      .post(`/organizations/${organizationId}/sites`)
      .set('X-CSRF-Token', csrfToken)
      .set('X-Correlation-Id', 'audit-site-create')
      .send({ name: 'Audit Site' })
      .expect(201);
    const siteId = siteResponse.body.id as string;
    const serviceResponse = await agent
      .post(`/organizations/${organizationId}/services`)
      .set('X-CSRF-Token', csrfToken)
      .set('X-Correlation-Id', 'audit-service-create')
      .send({ siteId, name: 'Audit Service' })
      .expect(201);
    const serviceId = serviceResponse.body.id as string;
    const userResponse = await agent
      .post(`/organizations/${organizationId}/users`)
      .set('X-CSRF-Token', csrfToken)
      .send({
        siteId,
        email: 'audit-created@example.test',
        fullName: 'Created User',
        role: 'ASESOR',
        password: 'correct-password',
      })
      .expect(201);
    const userId = userResponse.body.id as string;
    await agent
      .patch(`/organizations/${organizationId}/services/${serviceId}`)
      .set('X-CSRF-Token', csrfToken)
      .set('X-Correlation-Id', 'audit-service-update')
      .send({ name: 'Audit Service Updated' })
      .expect(200);
    await agent
      .post(`/organizations/${organizationId}/users/${userId}/services/${serviceId}`)
      .set('X-CSRF-Token', csrfToken)
      .expect(201);
    await agent
      .delete(`/organizations/${organizationId}/users/${userId}/services/${serviceId}`)
      .set('X-CSRF-Token', csrfToken)
      .expect(200);

    const logs = await prisma.adminAuditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
    expect(logs.length).toBeGreaterThanOrEqual(6);
    expect(logs.every((log) => log.actorUserId === actorUserId && log.actorType === 'USER')).toBe(
      true,
    );
    expect(logs.find((log) => log.correlationId === 'audit-service-update')).toMatchObject({
      actorUserId,
      siteId,
      resourceType: 'SERVICE',
      action: 'UPDATE',
    });
  });

  it('keeps mutation and audit atomic when audit persistence fails', async () => {
    const { agent, csrfToken } = await authenticatedAgent();
    const originalRecord = audit.record.bind(audit);
    const recordSpy = vi.spyOn(audit, 'record').mockImplementationOnce(async (client, entry) => {
      await originalRecord(client, entry);
      throw new Error('controlled audit failure');
    });
    const before = await prisma.site.count({ where: { organizationId } });

    await agent
      .post(`/organizations/${organizationId}/sites`)
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'Should Roll Back' })
      .expect(500);

    recordSpy.mockRestore();
    expect(await prisma.site.count({ where: { organizationId } })).toBe(before);
  });
});
