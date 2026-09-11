import { Module } from '@nestjs/common';

import { CounterController } from './counter.controller.js';
import { CounterService } from './counter.service.js';

@Module({ controllers: [CounterController], providers: [CounterService] })
export class CounterModule {}
