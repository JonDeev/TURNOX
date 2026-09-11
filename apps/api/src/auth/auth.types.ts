import type { Request } from 'express';

import type { AuthRole } from './roles.js';

export interface AuthContext {
  readonly userId: string;
  readonly organizationId: string;
  readonly siteId: string | null;
  readonly role: AuthRole;
  readonly email: string;
  readonly fullName: string;
  readonly sessionId: string;
  readonly sessionExpiresAt: Date;
}

export interface AuthenticatedRequest extends Request {
  authContext?: AuthContext;
}
