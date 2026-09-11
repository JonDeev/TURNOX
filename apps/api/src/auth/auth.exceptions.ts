import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';

export class AuthenticationRequiredException extends UnauthorizedException {
  constructor() {
    super({ code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' });
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
  }
}

export class AuthorizationDeniedException extends ForbiddenException {
  constructor() {
    super({ code: 'AUTHORIZATION_DENIED', message: 'Insufficient permissions' });
  }
}

export class LoginRateLimitException extends HttpException {
  constructor() {
    super(
      { code: 'AUTH_RATE_LIMITED', message: 'Too many authentication attempts' },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
