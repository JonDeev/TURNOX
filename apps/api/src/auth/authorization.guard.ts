import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthorizationDeniedException } from './auth.exceptions.js';
import { REQUIRED_PERMISSION } from './auth.decorators.js';
import type { AuthenticatedRequest } from './auth.types.js';
import { roleHasPermission, type Permission } from './permissions.js';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<Permission>(REQUIRED_PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const auth = request.authContext;
    if (
      permission === undefined ||
      auth === undefined ||
      !roleHasPermission(auth.role, permission)
    ) {
      throw new AuthorizationDeniedException();
    }

    const organizationId = request.params.organizationId as string | undefined;
    if (
      organizationId !== undefined &&
      auth.role !== 'SUPERADMINISTRADOR' &&
      organizationId !== auth.organizationId
    ) {
      throw new AuthorizationDeniedException();
    }
    if (organizationId === undefined && auth.role !== 'SUPERADMINISTRADOR') {
      throw new AuthorizationDeniedException();
    }
    return true;
  }
}
