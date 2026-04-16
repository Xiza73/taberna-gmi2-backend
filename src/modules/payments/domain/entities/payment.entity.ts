import { BaseEntity } from '@shared/domain/entities/base.entity.js';

import { type PaymentStatus } from '../enums/payment-status.enum.js';

export class Payment extends BaseEntity {
  private _orderId: string;
  private _externalId: string | null;
  private _preferenceId: string | null;
  private _method: string | null;
  private _status: PaymentStatus;
  private _amount: number;
  private _paidAt: Date | null;
  private _rawResponse: Record<string, unknown> | null;

  private constructor(
    id: string,
    orderId: string,
    externalId: string | null,
    preferenceId: string | null,
    method: string | null,
    status: PaymentStatus,
    amount: number,
    paidAt: Date | null,
    rawResponse: Record<string, unknown> | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._orderId = orderId;
    this._externalId = externalId;
    this._preferenceId = preferenceId;
    this._method = method;
    this._status = status;
    this._amount = amount;
    this._paidAt = paidAt;
    this._rawResponse = rawResponse;
  }

  static create(props: {
    orderId: string;
    preferenceId?: string | null;
    status: PaymentStatus;
    amount: number;
  }): Payment {
    return new Payment(
      undefined!,
      props.orderId,
      null,
      props.preferenceId ?? null,
      null,
      props.status,
      props.amount,
      null,
      null,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    orderId: string;
    externalId: string | null;
    preferenceId: string | null;
    method: string | null;
    status: PaymentStatus;
    amount: number;
    paidAt: Date | null;
    rawResponse: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
  }): Payment {
    return new Payment(
      props.id,
      props.orderId,
      props.externalId,
      props.preferenceId,
      props.method,
      props.status,
      props.amount,
      props.paidAt,
      props.rawResponse,
      props.createdAt,
      props.updatedAt,
    );
  }

  get orderId(): string {
    return this._orderId;
  }
  get externalId(): string | null {
    return this._externalId;
  }
  get preferenceId(): string | null {
    return this._preferenceId;
  }
  get method(): string | null {
    return this._method;
  }
  get status(): PaymentStatus {
    return this._status;
  }
  get amount(): number {
    return this._amount;
  }
  get paidAt(): Date | null {
    return this._paidAt;
  }
  get rawResponse(): Record<string, unknown> | null {
    return this._rawResponse;
  }

  updateFromProvider(props: {
    externalId?: string;
    method?: string;
    status?: PaymentStatus;
    paidAt?: Date;
    rawResponse?: Record<string, unknown>;
  }): void {
    if (props.externalId !== undefined) this._externalId = props.externalId;
    if (props.method !== undefined) this._method = props.method;
    if (props.status !== undefined) this._status = props.status;
    if (props.paidAt !== undefined) this._paidAt = props.paidAt;
    if (props.rawResponse !== undefined) this._rawResponse = props.rawResponse;
    this.markUpdated();
  }
}
