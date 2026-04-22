import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersModule } from '@modules/orders/orders.module';

import { ShipmentOrmEntity } from './infrastructure/orm-entities/shipment.orm-entity';
import { ShipmentRepository } from './infrastructure/repositories/shipment.repository';
import { SHIPMENT_REPOSITORY } from './domain/interfaces/shipment-repository.interface';
import {
  TrackingUrlGenerator,
  TRACKING_URL_GENERATOR,
} from './domain/services/tracking-url-generator';
import { GetShipmentUseCase } from './application/use-cases/get-shipment.use-case';
import { CreateShipmentUseCase } from './application/use-cases/create-shipment.use-case';
import { UpdateShipmentUseCase } from './application/use-cases/update-shipment.use-case';
import { ShipmentsController } from './presentation/shipments.controller';
import { AdminShipmentsController } from './presentation/admin-shipments.controller';

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
