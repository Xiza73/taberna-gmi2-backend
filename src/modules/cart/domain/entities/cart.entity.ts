import { BaseEntity } from '@shared/domain/entities/base.entity.js';

export class Cart extends BaseEntity {
  private _userId: string;

  private constructor(
    id: string,
    userId: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._userId = userId;
  }

  static create(props: { userId: string }): Cart {
    return new Cart(undefined!, props.userId, new Date(), new Date());
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Cart {
    return new Cart(props.id, props.userId, props.createdAt, props.updatedAt);
  }

  get userId(): string {
    return this._userId;
  }
}
