import { BaseEntity } from '@shared/domain/entities/base.entity';

import { type OrderStatus } from '../enums/order-status.enum';

export class OrderEvent extends BaseEntity {
  private _orderId: string;
  private _status: OrderStatus;
  private _description: string;
  private _performedBy: string | null;
  private _metadata: Record<string, unknown> | null;

  private constructor(
    id: string,
    orderId: string,
    status: OrderStatus,
    description: string,
    performedBy: string | null,
    metadata: Record<string, unknown> | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._orderId = orderId;
    this._status = status;
    this._description = description;
    this._performedBy = performedBy;
    this._metadata = metadata;
  }

  static create(props: {
    orderId: string;
    status: OrderStatus;
    description: string;
    performedBy?: string | null;
    metadata?: Record<string, unknown> | null;
  }): OrderEvent {
    return new OrderEvent(
      undefined!,
      props.orderId,
      props.status,
      props.description,
      props.performedBy ?? null,
      props.metadata ?? null,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    orderId: string;
    status: OrderStatus;
    description: string;
    performedBy: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
  }): OrderEvent {
    return new OrderEvent(
      props.id,
      props.orderId,
      props.status,
      props.description,
      props.performedBy,
      props.metadata,
      props.createdAt,
      props.updatedAt,
    );
  }

  get orderId(): string {
    return this._orderId;
  }
  get status(): OrderStatus {
    return this._status;
  }
  get description(): string {
    return this._description;
  }
  get performedBy(): string | null {
    return this._performedBy;
  }
  get metadata(): Record<string, unknown> | null {
    return this._metadata;
  }
}
