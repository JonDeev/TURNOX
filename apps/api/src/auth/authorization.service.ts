import { Injectable } from '@nestjs/common';

import { AuthorizationDeniedException } from './auth.exceptions.js';
import type { AuthContext } from './auth.types.js';

@Injectable()
export class AuthorizationService {
  assertOrganization(context: AuthContext, organizationId: string): void {
    if (context.role !== 'SUPERADMINISTRADOR' && context.organizationId !== organizationId) {
      throw new AuthorizationDeniedException();
    }
  }

  assertSite(context: AuthContext, organizationId: string, siteId: string): void {
    this.assertOrganization(context, organizationId);
    if (
      context.role !== 'SUPERADMINISTRADOR' &&
      context.siteId !== null &&
      context.siteId !== siteId
    ) {
      throw new AuthorizationDeniedException();
    }
  }

  siteFilter(context: AuthContext): { siteId?: string } {
    return context.siteId === null || context.role === 'SUPERADMINISTRADOR'
      ? {}
      : { siteId: context.siteId };
  }
}
