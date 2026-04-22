import { type Shipment } from '../../domain/entities/shipment.entity';

export class ShipmentResponseDto {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  status: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  constructor(shipment: Shipment) {
    this.id = shipment.id;
    this.orderId = shipment.orderId;
    this.carrier = shipment.carrier;
    this.trackingNumber = shipment.trackingNumber;
    this.trackingUrl = shipment.trackingUrl;
    this.status = shipment.status;
    this.shippedAt = shipment.shippedAt?.toISOString() ?? null;
    this.deliveredAt = shipment.deliveredAt?.toISOString() ?? null;
    this.notes = shipment.notes;
    this.createdAt = shipment.createdAt.toISOString();
    this.updatedAt = shipment.updatedAt.toISOString();
  }
}
