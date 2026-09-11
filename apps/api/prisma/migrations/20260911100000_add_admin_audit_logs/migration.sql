-- CreateEnum
CREATE TYPE "AdminAuditActorType" AS ENUM ('UNAUTHENTICATED', 'USER');

-- CreateEnum
CREATE TYPE "AdminAuditResourceType" AS ENUM ('ORGANIZATION', 'SITE', 'SERVICE', 'ROOM', 'COUNTER', 'USER', 'SERVICE_ASSIGNMENT', 'DEVICE');

-- CreateEnum
CREATE TYPE "AdminAuditAction" AS ENUM ('CREATE', 'UPDATE', 'ENABLE', 'DISABLE', 'ASSIGN', 'UNASSIGN');

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "siteId" UUID,
    "resourceType" "AdminAuditResourceType" NOT NULL,
    "resourceId" VARCHAR(160) NOT NULL,
    "action" "AdminAuditAction" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" UUID,
    "actorType" "AdminAuditActorType" NOT NULL DEFAULT 'UNAUTHENTICATED',
    "correlationId" VARCHAR(64),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_logs_organizationId_createdAt_idx" ON "admin_audit_logs"("organizationId", "createdAt");
CREATE INDEX "admin_audit_logs_resourceType_resourceId_idx" ON "admin_audit_logs"("resourceType", "resourceId");
CREATE INDEX "admin_audit_logs_actorUserId_createdAt_idx" ON "admin_audit_logs"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_organizationId_actorUserId_fkey" FOREIGN KEY ("organizationId", "actorUserId") REFERENCES "users"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
