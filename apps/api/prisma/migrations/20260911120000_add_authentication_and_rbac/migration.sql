-- P1.4: credentials, roles and server-side web sessions.
CREATE TYPE "UserRole" AS ENUM ('SUPERADMINISTRADOR', 'ADMINISTRADOR', 'SUPERVISOR', 'ASESOR');

ALTER TABLE "users"
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'ASESOR',
  ADD COLUMN "passwordHash" VARCHAR(255),
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastFailedLoginAt" TIMESTAMPTZ(3),
  ADD COLUMN "lockedUntil" TIMESTAMPTZ(3);

CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(3),
    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_sessions_tokenHash_key" ON "auth_sessions"("tokenHash");
CREATE INDEX "auth_sessions_organizationId_userId_expiresAt_idx" ON "auth_sessions"("organizationId", "userId", "expiresAt");
CREATE INDEX "auth_sessions_expiresAt_revokedAt_idx" ON "auth_sessions"("expiresAt", "revokedAt");

ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_organizationId_userId_fkey"
  FOREIGN KEY ("organizationId", "userId") REFERENCES "users"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A superadministrator may act on another organization. The existing composite
-- audit FK could not represent that valid actor/target relationship.
ALTER TABLE "admin_audit_logs" DROP CONSTRAINT "admin_audit_logs_organizationId_actorUserId_fkey";
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
