-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('KIOSK', 'PRINT_AGENT', 'DISPLAY');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sites" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "counters" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "roomId" UUID,
    "name" VARCHAR(120) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "counters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "siteId" UUID,
    "email" VARCHAR(320) NOT NULL,
    "fullName" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_assignments" (
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_assignments_pkey" PRIMARY KEY ("organizationId", "userId", "serviceId")
);

CREATE TABLE "devices" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "roomId" UUID,
    "name" VARCHAR(120) NOT NULL,
    "type" "DeviceType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "organizations_active_idx" ON "organizations"("active");
CREATE INDEX "sites_organizationId_active_idx" ON "sites"("organizationId", "active");
CREATE UNIQUE INDEX "sites_organizationId_id_key" ON "sites"("organizationId", "id");
CREATE UNIQUE INDEX "sites_organizationId_name_key" ON "sites"("organizationId", "name");
CREATE INDEX "services_organizationId_siteId_active_idx" ON "services"("organizationId", "siteId", "active");
CREATE UNIQUE INDEX "services_organizationId_id_key" ON "services"("organizationId", "id");
CREATE UNIQUE INDEX "services_siteId_name_key" ON "services"("siteId", "name");
CREATE INDEX "rooms_organizationId_siteId_active_idx" ON "rooms"("organizationId", "siteId", "active");
CREATE UNIQUE INDEX "rooms_organizationId_id_key" ON "rooms"("organizationId", "id");
CREATE UNIQUE INDEX "rooms_organizationId_siteId_id_key" ON "rooms"("organizationId", "siteId", "id");
CREATE UNIQUE INDEX "rooms_siteId_name_key" ON "rooms"("siteId", "name");
CREATE INDEX "counters_organizationId_siteId_active_idx" ON "counters"("organizationId", "siteId", "active");
CREATE UNIQUE INDEX "counters_organizationId_id_key" ON "counters"("organizationId", "id");
CREATE UNIQUE INDEX "counters_siteId_name_key" ON "counters"("siteId", "name");
CREATE INDEX "users_organizationId_siteId_active_idx" ON "users"("organizationId", "siteId", "active");
CREATE UNIQUE INDEX "users_organizationId_id_key" ON "users"("organizationId", "id");
CREATE UNIQUE INDEX "users_organizationId_email_key" ON "users"("organizationId", "email");
CREATE INDEX "service_assignments_organizationId_serviceId_idx" ON "service_assignments"("organizationId", "serviceId");
CREATE INDEX "devices_organizationId_siteId_type_enabled_idx" ON "devices"("organizationId", "siteId", "type", "enabled");
CREATE UNIQUE INDEX "devices_organizationId_id_key" ON "devices"("organizationId", "id");
CREATE UNIQUE INDEX "devices_siteId_name_key" ON "devices"("siteId", "name");

ALTER TABLE "sites" ADD CONSTRAINT "sites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "services" ADD CONSTRAINT "services_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "services" ADD CONSTRAINT "services_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "counters" ADD CONSTRAINT "counters_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "counters" ADD CONSTRAINT "counters_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "counters" ADD CONSTRAINT "counters_organizationId_siteId_roomId_fkey" FOREIGN KEY ("organizationId", "siteId", "roomId") REFERENCES "rooms"("organizationId", "siteId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_assignments" ADD CONSTRAINT "service_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_assignments" ADD CONSTRAINT "service_assignments_organizationId_userId_fkey" FOREIGN KEY ("organizationId", "userId") REFERENCES "users"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_assignments" ADD CONSTRAINT "service_assignments_organizationId_serviceId_fkey" FOREIGN KEY ("organizationId", "serviceId") REFERENCES "services"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "devices" ADD CONSTRAINT "devices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "devices" ADD CONSTRAINT "devices_organizationId_siteId_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "sites"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "devices" ADD CONSTRAINT "devices_organizationId_siteId_roomId_fkey" FOREIGN KEY ("organizationId", "siteId", "roomId") REFERENCES "rooms"("organizationId", "siteId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION turnox_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_set_updated_at BEFORE UPDATE ON "organizations" FOR EACH ROW EXECUTE FUNCTION turnox_set_updated_at();
CREATE TRIGGER sites_set_updated_at BEFORE UPDATE ON "sites" FOR EACH ROW EXECUTE FUNCTION turnox_set_updated_at();
CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON "services" FOR EACH ROW EXECUTE FUNCTION turnox_set_updated_at();
CREATE TRIGGER rooms_set_updated_at BEFORE UPDATE ON "rooms" FOR EACH ROW EXECUTE FUNCTION turnox_set_updated_at();
CREATE TRIGGER counters_set_updated_at BEFORE UPDATE ON "counters" FOR EACH ROW EXECUTE FUNCTION turnox_set_updated_at();
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION turnox_set_updated_at();
CREATE TRIGGER devices_set_updated_at BEFORE UPDATE ON "devices" FOR EACH ROW EXECUTE FUNCTION turnox_set_updated_at();
