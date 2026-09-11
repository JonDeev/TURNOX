import { Module } from '@nestjs/common';

import { DeviceController } from './device.controller.js';
import { DeviceService } from './device.service.js';

@Module({ controllers: [DeviceController], providers: [DeviceService] })
export class DeviceModule {}
