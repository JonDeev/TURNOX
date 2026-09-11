import { BadRequestException, NotFoundException } from '@nestjs/common';

export class ResourceNotFoundException extends NotFoundException {
  constructor(resource: string) {
    super({ code: 'RESOURCE_NOT_FOUND', message: `${resource} not found` });
  }
}

export class InvalidRelationshipException extends BadRequestException {
  constructor(message = 'The resource relationship is invalid') {
    super({ code: 'INVALID_RELATIONSHIP', message });
  }
}
