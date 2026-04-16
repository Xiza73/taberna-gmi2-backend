import { BaseEntity } from '@shared/domain/entities/base.entity.js';
import { DomainException } from '@shared/domain/exceptions/index.js';

export class Review extends BaseEntity {
  private _userId: string;
  private _productId: string;
  private _orderId: string;
  private _rating: number;
  private _comment: string | null;
  private _isApproved: boolean;

  private constructor(
    id: string,
    userId: string,
    productId: string,
    orderId: string,
    rating: number,
    comment: string | null,
    isApproved: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._userId = userId;
    this._productId = productId;
    this._orderId = orderId;
    this._rating = rating;
    this._comment = comment;
    this._isApproved = isApproved;
  }

  static create(props: {
    userId: string;
    productId: string;
    orderId: string;
    rating: number;
    comment?: string | null;
  }): Review {
    if (
      props.rating < 1 ||
      props.rating > 5 ||
      !Number.isInteger(props.rating)
    ) {
      throw new DomainException('Rating must be an integer between 1 and 5');
    }
    return new Review(
      undefined!,
      props.userId,
      props.productId,
      props.orderId,
      props.rating,
      props.comment ?? null,
      false,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    productId: string;
    orderId: string;
    rating: number;
    comment: string | null;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Review {
    return new Review(
      props.id,
      props.userId,
      props.productId,
      props.orderId,
      props.rating,
      props.comment,
      props.isApproved,
      props.createdAt,
      props.updatedAt,
    );
  }

  get userId(): string {
    return this._userId;
  }
  get productId(): string {
    return this._productId;
  }
  get orderId(): string {
    return this._orderId;
  }
  get rating(): number {
    return this._rating;
  }
  get comment(): string | null {
    return this._comment;
  }
  get isApproved(): boolean {
    return this._isApproved;
  }

  approve(): void {
    this._isApproved = true;
    this.markUpdated();
  }

  update(props: { rating?: number; comment?: string | null }): void {
    if (props.rating !== undefined) {
      if (
        props.rating < 1 ||
        props.rating > 5 ||
        !Number.isInteger(props.rating)
      ) {
        throw new DomainException('Rating must be an integer between 1 and 5');
      }
      this._rating = props.rating;
    }
    if (props.comment !== undefined) this._comment = props.comment;
    this._isApproved = false;
    this.markUpdated();
  }
}
