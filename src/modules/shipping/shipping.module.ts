import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersModule } from '@modules/orders/orders.module.js';

import { ShipmentOrmEntity } from './infrastructure/orm-entities/shipment.orm-entity.js';
import { ShipmentRepository } from './infrastructure/repositories/shipment.repository.js';
import { SHIPMENT_REPOSITORY } from './domain/interfaces/shipment-repository.interface.js';
import {
  TrackingUrlGenerator,
  TRACKING_URL_GENERATOR,
} from './domain/services/tracking-url-generator.js';
import { GetShipmentUseCase } from './application/use-cases/get-shipment.use-case.js';
import { CreateShipmentUseCase } from './application/use-cases/create-shipment.use-case.js';
import { UpdateShipmentUseCase } from './application/use-cases/update-shipment.use-case.js';
import { ShipmentsController } from './presentation/shipments.controller.js';
import { AdminShipmentsController } from './presentation/admin-shipments.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ShipmentOrmEntity]), OrdersModule],
  controllers: [ShipmentsController, AdminShipmentsController],
  providers: [
    { provide: SHIPMENT_REPOSITORY, useClass: ShipmentRepository },
    { provide: TRACKING_URL_GENERATOR, useValue: new TrackingUrlGenerator() },
    GetShipmentUseCase,
    CreateShipmentUseCase,
    UpdateShipmentUseCase,
  ],
  exports: [SHIPMENT_REPOSITORY],
})
export class ShippingModule {}
