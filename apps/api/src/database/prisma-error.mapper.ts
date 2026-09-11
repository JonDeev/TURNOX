import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';

export function mapPrismaWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException({
        code: 'RESOURCE_CONFLICT',
        message: 'A resource with the same unique value already exists',
      });
    }

    if (error.code === 'P2003') {
      throw new ConflictException({
        code: 'INTEGRITY_CONSTRAINT',
        message: 'The operation violates a resource relationship',
      });
    }

    if (error.code === 'P2025') {
      throw new ConflictException({
        code: 'RESOURCE_STATE_CONFLICT',
        message: 'The resource could not be updated in its current state',
      });
    }
  }

  throw new InternalServerErrorException({
    code: 'PERSISTENCE_ERROR',
    message: 'The persistence operation could not be completed',
  });
}
