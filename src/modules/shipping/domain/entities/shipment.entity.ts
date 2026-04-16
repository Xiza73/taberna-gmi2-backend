import { BaseEntity } from '@shared/domain/entities/base.entity.js';

import { type Carrier } from '../enums/carrier.enum.js';
import { type ShipmentStatus } from '../enums/shipment-status.enum.js';

export class Shipment extends BaseEntity {
  private _orderId: string;
  private _carrier: Carrier;
  private _trackingNumber: string;
  private _trackingUrl: string;
  private _status: ShipmentStatus;
  private _shippedAt: Date | null;
  private _deliveredAt: Date | null;
  private _notes: string | null;

  private constructor(
    id: string,
    orderId: string,
    carrier: Carrier,
    trackingNumber: string,
    trackingUrl: string,
    status: ShipmentStatus,
    shippedAt: Date | null,
    deliveredAt: Date | null,
    notes: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._orderId = orderId;
    this._carrier = carrier;
    this._trackingNumber = trackingNumber;
    this._trackingUrl = trackingUrl;
    this._status = status;
    this._shippedAt = shippedAt;
    this._deliveredAt = deliveredAt;
    this._notes = notes;
  }

  static create(props: {
    orderId: string;
    carrier: Carrier;
    trackingNumber: string;
    trackingUrl: string;
    status: ShipmentStatus;
    shippedAt?: Date | null;
    notes?: string | null;
  }): Shipment {
    return new Shipment(
      undefined!,
      props.orderId,
      props.carrier,
      props.trackingNumber,
      props.trackingUrl,
      props.status,
      props.shippedAt ?? new Date(),
      null,
      props.notes ?? null,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    orderId: string;
    carrier: Carrier;
    trackingNumber: string;
    trackingUrl: string;
    status: ShipmentStatus;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Shipment {
    return new Shipment(
      props.id,
      props.orderId,
      props.carrier,
      props.trackingNumber,
      props.trackingUrl,
      props.status,
      props.shippedAt,
      props.deliveredAt,
      props.notes,
      props.createdAt,
      props.updatedAt,
    );
  }

  get orderId(): string { return this._orderId; }
  get carrier(): Carrier { return this._carrier; }
  get trackingNumber(): string { return this._trackingNumber; }
  get trackingUrl(): string { return this._trackingUrl; }
  get status(): ShipmentStatus { return this._status; }
  get shippedAt(): Date | null { return this._shippedAt; }
  get deliveredAt(): Date | null { return this._deliveredAt; }
  get notes(): string | null { return this._notes; }

  update(props: {
    carrier?: Carrier;
    trackingNumber?: string;
    trackingUrl?: string;
    status?: ShipmentStatus;
    deliveredAt?: Date;
    notes?: string | null;
  }): void {
    if (props.carrier !== undefined) this._carrier = props.carrier;
    if (props.trackingNumber !== undefined) this._trackingNumber = props.trackingNumber;
    if (props.trackingUrl !== undefined) this._trackingUrl = props.trackingUrl;
    if (props.status !== undefined) this._status = props.status;
    if (props.deliveredAt !== undefined) this._deliveredAt = props.deliveredAt;
    if (props.notes !== undefined) this._notes = props.notes;
    this.markUpdated();
  }
}
