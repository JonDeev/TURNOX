import { randomUUID } from 'node:crypto';

import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from './app.module.js';
import { PrismaService } from './database/prisma.service.js';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';
if (runIntegration && process.env.DATABASE_URL === undefined) {
  throw new Error('DATABASE_URL is required when RUN_INTEGRATION_TESTS=true');
}
const integration = runIntegration ? describe : describe.skip;

integration('organizational model against PostgreSQL', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const testOrganizationIds: string[] = [];

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (prisma !== undefined && testOrganizationIds.length > 0) {
      const scope = { organizationId: { in: testOrganizationIds } };
      await prisma.serviceAssignment.deleteMany({ where: scope });
      await prisma.device.deleteMany({ where: scope });
      await prisma.counter.deleteMany({ where: scope });
      await prisma.room.deleteMany({ where: scope });
      await prisma.service.deleteMany({ where: scope });
      await prisma.user.deleteMany({ where: scope });
      await prisma.site.deleteMany({ where: scope });
      await prisma.organization.deleteMany({ where: { id: { in: testOrganizationIds } } });
    }
    await app?.close();
  });

  it('persists valid configuration and rejects cross-organization relationships', async () => {
    const http = request(app.getHttpServer());
    await http.get('/health/live').expect(200, { status: 'ok' });
    const organizationA = await http.post('/organizations').send({ name: 'Org A' }).expect(201);
    const organizationB = await http.post('/organizations').send({ name: 'Org B' }).expect(201);
    const orgA = organizationA.body.id as string;
    const orgB = organizationB.body.id as string;
    testOrganizationIds.push(orgA, orgB);

    await http.get(`/organizations/${orgA}`).expect(200);
    const organizations = await http.get('/organizations').expect(200);
    expect(organizations.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: orgA }),
        expect.objectContaining({ id: orgB }),
      ]),
    );
    await http.patch(`/organizations/${orgA}`).send({ active: false }).expect(200);
    await http
      .patch(`/organizations/${orgA}`)
      .send({ name: 'Org A Updated', active: true })
      .expect(200);
    await http.get('/health/ready').expect(200);

    const siteAResponse = await http
      .post(`/organizations/${orgA}/sites`)
      .send({ name: 'Sede A' })
      .expect(201);
    const siteBResponse = await http
      .post(`/organizations/${orgB}/sites`)
      .send({ name: 'Sede B' })
      .expect(201);
    const siteA = siteAResponse.body.id as string;
    const siteB = siteBResponse.body.id as string;

    await http.post(`/organizations/${orgA}/sites`).send({ name: 'Sede A' }).expect(409);
    await http.get(`/organizations/${orgB}/sites/${siteA}`).expect(404);

    const roomAResponse = await http
      .post(`/organizations/${orgA}/rooms`)
      .send({ siteId: siteA, name: 'Sala A' })
      .expect(201);
    const roomA = roomAResponse.body.id as string;
    const roomBResponse = await http
      .post(`/organizations/${orgB}/rooms`)
      .send({ siteId: siteB, name: 'Sala B' })
      .expect(201);
    const roomB = roomBResponse.body.id as string;
    const serviceAResponse = await http
      .post(`/organizations/${orgA}/services`)
      .send({ siteId: siteA, name: 'Información' })
      .expect(201);
    const serviceA = serviceAResponse.body.id as string;
    const serviceBResponse = await http
      .post(`/organizations/${orgB}/services`)
      .send({ siteId: siteB, name: 'Información' })
      .expect(201);
    const serviceB = serviceBResponse.body.id as string;
    const userAResponse = await http
      .post(`/organizations/${orgA}/users`)
      .send({ siteId: siteA, email: 'asesor@orga.test', fullName: 'Asesor A' })
      .expect(201);
    const userA = userAResponse.body.id as string;

    await http
      .post(`/organizations/${orgA}/services`)
      .send({ siteId: siteB, name: 'Cruce' })
      .expect(400);
    await http
      .post(`/organizations/${orgA}/rooms`)
      .send({ siteId: siteB, name: 'Sala inválida' })
      .expect(400);
    await http
      .post(`/organizations/${orgA}/counters`)
      .send({ siteId: siteA, roomId: roomB, name: 'Módulo inválido' })
      .expect(400);
    await http
      .post(`/organizations/${orgA}/devices`)
      .send({ siteId: siteA, roomId: roomB, name: 'Display inválido', type: 'DISPLAY' })
      .expect(400);
    await http
      .post(`/organizations/${orgA}/users`)
      .send({ siteId: siteB, email: 'cruce@orga.test', fullName: 'Usuario inválido' })
      .expect(400);
    await http.post(`/organizations/${orgA}/users/${userA}/services/${serviceA}`).expect(201);
    await http.post(`/organizations/${orgB}/users/${userA}/services/${serviceA}`).expect(400);
    await http.post(`/organizations/${orgA}/users/${userA}/services/${serviceA}`).expect(409);

    await expect(
      prisma.$executeRaw`
        INSERT INTO "services" ("id", "organizationId", "siteId", "name")
        VALUES (${randomUUID()}::uuid, ${orgA}::uuid, ${siteB}::uuid, 'DB cross-service')`,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        INSERT INTO "rooms" ("id", "organizationId", "siteId", "name")
        VALUES (${randomUUID()}::uuid, ${orgA}::uuid, ${siteB}::uuid, 'DB cross-room')`,
    ).rejects.toThrow();

    const counterResponse = await http
      .post(`/organizations/${orgA}/counters`)
      .send({ siteId: siteA, roomId: roomA, name: 'Módulo 1' })
      .expect(201);
    expect(counterResponse.body.roomId).toBe(roomA);

    const deviceResponse = await http
      .post(`/organizations/${orgA}/devices`)
      .send({
        siteId: siteA,
        roomId: roomA,
        name: 'Display 1',
        type: 'DISPLAY',
        metadata: { zone: 'public' },
      })
      .expect(201);
    expect(deviceResponse.body.type).toBe('DISPLAY');
    expect(deviceResponse.body.metadata).toEqual({ zone: 'public' });

    await expect(
      prisma.$executeRaw`
        INSERT INTO "counters" ("id", "organizationId", "siteId", "roomId", "name")
        VALUES (${randomUUID()}::uuid, ${orgA}::uuid, ${siteA}::uuid, ${roomB}::uuid, 'DB cross-counter')`,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        INSERT INTO "devices" ("id", "organizationId", "siteId", "roomId", "name", "type")
        VALUES (${randomUUID()}::uuid, ${orgA}::uuid, ${siteA}::uuid, ${roomB}::uuid, 'DB cross-device', 'DISPLAY'::"DeviceType")`,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        INSERT INTO "service_assignments" ("organizationId", "userId", "serviceId")
        VALUES (${orgA}::uuid, ${userA}::uuid, ${serviceB}::uuid)`,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        INSERT INTO "organizations" ("id", "name")
        VALUES (${randomUUID()}::uuid, NULL)`,
    ).rejects.toThrow();
  });
});
