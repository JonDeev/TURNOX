import { createParamDecorator, SetMetadata } from '@nestjs/common';

import type { AuthenticatedRequest } from './auth.types.js';
import type { Permission } from './permissions.js';

export const REQUIRED_PERMISSION = 'turnox:required-permission';

export const RequirePermission = (permission: Permission) =>
  SetMetadata(REQUIRED_PERMISSION, permission);

export const CurrentUser = createParamDecorator((_, context) => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.authContext;
});
