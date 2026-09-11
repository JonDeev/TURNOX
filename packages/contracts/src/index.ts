export const AUTH_ROLES = ['SUPERADMINISTRADOR', 'ADMINISTRADOR', 'SUPERVISOR', 'ASESOR'] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

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

export interface StableApiError {
  readonly statusCode: number;
  readonly code: string;
  readonly message: string | readonly string[];
  readonly correlationId: string;
  readonly timestamp: string;
}
