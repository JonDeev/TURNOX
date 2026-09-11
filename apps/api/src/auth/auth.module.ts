import { Global, Module } from '@nestjs/common';

import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthorizationGuard } from './authorization.guard.js';
import { AuthService } from './auth.service.js';
import { CsrfGuard } from './csrf.guard.js';
import { PasswordHasher } from './password-hasher.js';
import { AuthorizationService } from './authorization.service.js';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthGuard,
    AuthorizationGuard,
    AuthorizationService,
    AuthService,
    CsrfGuard,
    PasswordHasher,
  ],
  exports: [
    AuthGuard,
    AuthorizationGuard,
    AuthorizationService,
    AuthService,
    CsrfGuard,
    PasswordHasher,
  ],
})
export class AuthModule {}
