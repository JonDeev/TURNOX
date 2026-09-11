import { Module } from '@nestjs/common';

import { ServiceAssignmentController } from './service-assignment.controller.js';
import { ServiceAssignmentService } from './service-assignment.service.js';

@Module({ controllers: [ServiceAssignmentController], providers: [ServiceAssignmentService] })
export class ServiceAssignmentModule {}
