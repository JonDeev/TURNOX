import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AppModule } from './app.module.js';
import { configureApplication } from './app.factory.js';
import { AdminAuditService } from './audit/audit.service.js';
import { PrismaService } from './database/prisma.service.js';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';
if (runIntegration && process.env.DATABASE_URL === undefined) {
  throw new Error('DATABASE_URL is required when RUN_INTEGRATION_TESTS=true');
}
const integration = runIntegration ? describe : describe.skip;

integration('administrative audit against PostgreSQL', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let audit: AdminAuditService;
  const organizationIds: string[] = [];

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    configureApplication(app);
    await app.init();
    prisma = app.get(PrismaService);
    audit = app.get(AdminAuditService);
  });

  afterAll(async () => {
    if (prisma !== undefined && organizationIds.length > 0) {
      const scope = { organizationId: { in: organizationIds } };
      await prisma.adminAuditLog.deleteMany({ where: scope });
      await prisma.serviceAssignment.deleteMany({ where: scope });
      await prisma.device.deleteMany({ where: scope });
      await prisma.counter.deleteMany({ where: scope });
      await prisma.room.deleteMany({ where: scope });
      await prisma.service.deleteMany({ where: scope });
      await prisma.user.deleteMany({ where: scope });
      await prisma.site.deleteMany({ where: scope });
      await prisma.organization.deleteMany({ where: { id: { in: organizationIds } } });
    }
    await app?.close();
  });

  it('records scoped administrative mutations without inventing authentication', async () => {
    const http = request(app.getHttpServer());
    const orgAResponse = await http
      .post('/organizations')
      .set('X-Correlation-Id', 'audit-org-create')
      .send({ name: 'Audit Org A' })
      .expect(201);
    const orgA = orgAResponse.body.id as string;
    organizationIds.push(orgA);

    const createLog = await prisma.adminAuditLog.findMany({
      where: { organizationId: orgA, resourceType: 'ORGANIZATION', resourceId: orgA },
    });
    expect(createLog).toHaveLength(1);
    expect(createLog[0]).toMatchObject({
      organizationId: orgA,
      siteId: null,
      resourceType: 'ORGANIZATION',
      resourceId: orgA,
      action: 'CREATE',
      actorUserId: null,
      actorType: 'UNAUTHENTICATED',
      correlationId: 'audit-org-create',
      metadata: { changedFields: [] },
    });
    expect(createLog[0]?.createdAt).toBeInstanceOf(Date);

    const siteResponse = await http
      .post(`/organizations/${orgA}/sites`)
      .set('X-Correlation-Id', 'audit-site-create')
      .send({ name: 'Audit Site' })
      .expect(201);
    const siteId = siteResponse.body.id as string;
    const serviceResponse = await http
      .post(`/organizations/${orgA}/services`)
      .set('X-Correlation-Id', 'audit-service-create')
      .send({ siteId, name: 'Audit Service' })
      .expect(201);
    const serviceId = serviceResponse.body.id as string;
    const userResponse = await http
      .post(`/organizations/${orgA}/users`)
      .set('X-Correlation-Id', 'audit-user-create')
      .send({ siteId, email: 'audit-user@example.test', fullName: 'Audit User' })
      .expect(201);
    const userId = userResponse.body.id as string;

    await http
      .patch(`/organizations/${orgA}/services/${serviceId}`)
      .set('X-Correlation-Id', 'audit-service-update')
      .send({ name: 'Audit Service Updated' })
      .expect(200);
    await http
      .patch(`/organizations/${orgA}/sites/${siteId}`)
      .set('X-Correlation-Id', 'audit-site-disable')
      .send({ active: false })
      .expect(200);
    await http
      .patch(`/organizations/${orgA}/sites/${siteId}`)
      .set('X-Correlation-Id', 'audit-site-enable')
      .send({ active: true })
      .expect(200);
    await http
      .post(`/organizations/${orgA}/users/${userId}/services/${serviceId}`)
      .set('X-Correlation-Id', 'audit-assignment')
      .expect(201);
    await http
      .delete(`/organizations/${orgA}/users/${userId}/services/${serviceId}`)
      .set('X-Correlation-Id', 'audit-unassignment')
      .expect(200);

    const serviceLogs = await prisma.adminAuditLog.findMany({
      where: { organizationId: orgA, resourceType: 'SERVICE', resourceId: serviceId },
      orderBy: { createdAt: 'asc' },
    });
    expect(serviceLogs.map((log) => log.action)).toEqual(['CREATE', 'UPDATE']);
    expect(serviceLogs[1]).toMatchObject({
      siteId,
      correlationId: 'audit-service-update',
      metadata: { changedFields: ['name'] },
    });

    const siteLogs = await prisma.adminAuditLog.findMany({
      where: { organizationId: orgA, resourceType: 'SITE', resourceId: siteId },
      orderBy: { createdAt: 'asc' },
    });
    expect(siteLogs.map((log) => log.action)).toEqual(['CREATE', 'DISABLE', 'ENABLE']);

    const assignmentLogs = await prisma.adminAuditLog.findMany({
      where: { organizationId: orgA, resourceType: 'SERVICE_ASSIGNMENT' },
    });
    expect(assignmentLogs).toHaveLength(2);
    expect(assignmentLogs.map((log) => log.action).sort()).toEqual(['ASSIGN', 'UNASSIGN']);
    expect(assignmentLogs.every((log) => log.siteId === siteId)).toBe(true);
    expect(assignmentLogs.every((log) => log.actorUserId === null)).toBe(true);
  });

  it('preserves organization scope and rolls back when audit persistence fails', async () => {
    const http = request(app.getHttpServer());
    const orgAResponse = await http
      .post('/organizations')
      .send({ name: 'Atomic Org A' })
      .expect(201);
    const orgBResponse = await http
      .post('/organizations')
      .send({ name: 'Atomic Org B' })
      .expect(201);
    const orgA = orgAResponse.body.id as string;
    const orgB = orgBResponse.body.id as string;
    organizationIds.push(orgA, orgB);

    const siteCountBefore = await prisma.site.count({ where: { organizationId: orgA } });
    const auditCountBefore = await prisma.adminAuditLog.count({ where: { organizationId: orgA } });
    const originalRecord = audit.record.bind(audit);
    const recordSpy = vi.spyOn(audit, 'record').mockImplementationOnce(async (client, entry) => {
      await originalRecord(client, entry);
      throw new Error('controlled audit failure');
    });

    await http.post(`/organizations/${orgA}/sites`).send({ name: 'Should Roll Back' }).expect(500);

    recordSpy.mockRestore();
    expect(await prisma.site.count({ where: { organizationId: orgA } })).toBe(siteCountBefore);
    expect(await prisma.adminAuditLog.count({ where: { organizationId: orgA } })).toBe(
      auditCountBefore,
    );
    expect(
      await prisma.adminAuditLog.count({
        where: { organizationId: orgB, resourceType: 'SITE' },
      }),
    ).toBe(0);
  });
});
