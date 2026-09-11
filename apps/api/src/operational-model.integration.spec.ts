import { randomUUID } from 'node:crypto';

import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { Response } from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from './app.module.js';
import { configureApplication } from './app.factory.js';
import { PasswordHasher } from './auth/password-hasher.js';
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

integration('organizational model against PostgreSQL', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let organizationA: string;
  let organizationB: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    configureApplication(app);
    await app.init();
    prisma = app.get(PrismaService);
    const hasher = app.get(PasswordHasher);
    const [orgA, orgB] = await Promise.all([
      prisma.organization.create({ data: { name: 'Org A' } }),
      prisma.organization.create({ data: { name: 'Org B' } }),
    ]);
    organizationA = orgA.id;
    organizationB = orgB.id;
    await prisma.user.create({
      data: {
        organizationId: organizationA,
        email: 'operational-admin@example.test',
        fullName: 'Operational Admin',
        role: 'ADMINISTRADOR',
        passwordHash: await hasher.hash('correct-password'),
      },
    });
  });

  afterAll(async () => {
    if (prisma !== undefined && organizationA !== undefined) {
      const scope = { organizationId: { in: [organizationA, organizationB] } };
      await prisma.adminAuditLog.deleteMany({ where: scope });
      await prisma.authSession.deleteMany({ where: scope });
      await prisma.serviceAssignment.deleteMany({ where: scope });
      await prisma.device.deleteMany({ where: scope });
      await prisma.counter.deleteMany({ where: scope });
      await prisma.room.deleteMany({ where: scope });
      await prisma.service.deleteMany({ where: scope });
      await prisma.user.deleteMany({ where: scope });
      await prisma.site.deleteMany({ where: scope });
      await prisma.organization.deleteMany({
        where: { id: { in: [organizationA, organizationB] } },
      });
    }
    await app?.close();
  });

  it('persists valid configuration, preserves health and rejects cross-organization relationships', async () => {
    const agent = request.agent(app.getHttpServer());
    const login = await agent.post('/auth/login').send({
      organizationId: organizationA,
      email: 'operational-admin@example.test',
      password: 'correct-password',
    });
    const csrfToken = cookieValue(login, 'turnox_csrf');
    await agent.get('/health/live').expect(200, { status: 'ok' });
    await agent.get('/health/ready').expect(200);
    await agent.get(`/organizations/${organizationB}`).expect(403);

    const siteAResponse = await agent
      .post(`/organizations/${organizationA}/sites`)
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'Sede A' })
      .expect(201);
    const siteA = siteAResponse.body.id as string;
    const siteB = (
      await prisma.site.create({
        data: { organizationId: organizationB, name: 'Sede B' },
      })
    ).id;
    await agent
      .post(`/organizations/${organizationA}/sites`)
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'Sede A' })
      .expect(409);

    const roomA = (
      await agent
        .post(`/organizations/${organizationA}/rooms`)
        .set('X-CSRF-Token', csrfToken)
        .send({ siteId: siteA, name: 'Sala A' })
        .expect(201)
    ).body.id as string;
    const serviceA = (
      await agent
        .post(`/organizations/${organizationA}/services`)
        .set('X-CSRF-Token', csrfToken)
        .send({ siteId: siteA, name: 'Información' })
        .expect(201)
    ).body.id as string;
    const userA = (
      await agent
        .post(`/organizations/${organizationA}/users`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          siteId: siteA,
          email: 'asesor@orga.test',
          fullName: 'Asesor A',
          role: 'ASESOR',
          password: 'correct-password',
        })
        .expect(201)
    ).body.id as string;
    await agent
      .post(`/organizations/${organizationA}/users/${userA}/services/${serviceA}`)
      .set('X-CSRF-Token', csrfToken)
      .expect(201);

    const counter = await agent
      .post(`/organizations/${organizationA}/counters`)
      .set('X-CSRF-Token', csrfToken)
      .send({ siteId: siteA, roomId: roomA, name: 'Módulo 1' })
      .expect(201);
    expect(counter.body.roomId).toBe(roomA);
    const device = await agent
      .post(`/organizations/${organizationA}/devices`)
      .set('X-CSRF-Token', csrfToken)
      .send({
        siteId: siteA,
        roomId: roomA,
        name: 'Display 1',
        type: 'DISPLAY',
        metadata: { zone: 'public' },
      })
      .expect(201);
    expect(device.body.metadata).toEqual({ zone: 'public' });

    await agent
      .post(`/organizations/${organizationA}/services`)
      .set('X-CSRF-Token', csrfToken)
      .send({ siteId: siteB, name: 'Cruce' })
      .expect(400);
    await agent.get(`/organizations/${organizationA}/sites/${siteB}`).expect(404);
    await expect(
      prisma.$executeRaw`
        INSERT INTO "services" ("id", "organizationId", "siteId", "name")
        VALUES (${randomUUID()}::uuid, ${organizationA}::uuid, ${siteB}::uuid, 'DB cross-service')`,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        INSERT INTO "counters" ("id", "organizationId", "siteId", "roomId", "name")
        VALUES (${randomUUID()}::uuid, ${organizationA}::uuid, ${siteA}::uuid, ${randomUUID()}::uuid, 'DB cross-counter')`,
    ).rejects.toThrow();
  });
});
