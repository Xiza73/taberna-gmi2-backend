import { BaseEntity } from '@shared/domain/entities/base.entity.js';

export class WishlistItem extends BaseEntity {
  private _userId: string;
  private _productId: string;

  private constructor(
    id: string,
    userId: string,
    productId: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._userId = userId;
    this._productId = productId;
  }

  static create(props: { userId: string; productId: string }): WishlistItem {
    return new WishlistItem(
      undefined!,
      props.userId,
      props.productId,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    productId: string;
    createdAt: Date;
    updatedAt: Date;
  }): WishlistItem {
    return new WishlistItem(
      props.id,
      props.userId,
      props.productId,
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
}
