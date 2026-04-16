import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface.js';

import { type Shipment } from '../entities/shipment.entity.js';

export const SHIPMENT_REPOSITORY = Symbol('SHIPMENT_REPOSITORY');

export interface IShipmentRepository extends IBaseRepository<Shipment> {
  findByOrderId(orderId: string): Promise<Shipment | null>;
}
