import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from './app.module.js';
import { PrismaService } from './database/prisma.service.js';

const runIntegration =
  process.env.RUN_INTEGRATION_TESTS === 'true' && process.env.DATABASE_URL !== undefined;
const integration = runIntegration ? describe : describe.skip;

integration('organizational model against PostgreSQL', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.serviceAssignment.deleteMany();
    await prisma.device.deleteMany();
    await prisma.counter.deleteMany();
    await prisma.room.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();
    await prisma.site.deleteMany();
    await prisma.organization.deleteMany();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('persists valid configuration and rejects cross-organization relationships', async () => {
    const http = request(app.getHttpServer());
    const organizationA = await http.post('/organizations').send({ name: 'Org A' }).expect(201);
    const organizationB = await http.post('/organizations').send({ name: 'Org B' }).expect(201);
    const orgA = organizationA.body.id as string;
    const orgB = organizationB.body.id as string;

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
    const serviceAResponse = await http
      .post(`/organizations/${orgA}/services`)
      .send({ siteId: siteA, name: 'Información' })
      .expect(201);
    const serviceA = serviceAResponse.body.id as string;
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
      .post(`/organizations/${orgA}/counters`)
      .send({ siteId: siteA, roomId: siteB, name: 'Módulo inválido' })
      .expect(400);
    await http
      .post(`/organizations/${orgA}/devices`)
      .send({ siteId: siteA, roomId: siteB, name: 'Display inválido', type: 'DISPLAY' })
      .expect(400);
    await http.post(`/organizations/${orgA}/users/${userA}/services/${serviceA}`).expect(201);
    await http.post(`/organizations/${orgB}/users/${userA}/services/${serviceA}`).expect(400);

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
  });
});
