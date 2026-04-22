import { BaseEntity } from '@shared/domain/entities/base.entity';
import { DomainException } from '@shared/domain/exceptions/index';

export class CartItem extends BaseEntity {
  private _cartId: string;
  private _productId: string;
  private _quantity: number;

  private constructor(
    id: string,
    cartId: string,
    productId: string,
    quantity: number,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._cartId = cartId;
    this._productId = productId;
    this._quantity = quantity;
  }

  static create(props: {
    cartId: string;
    productId: string;
    quantity: number;
  }): CartItem {
    if (props.quantity < 1) {
      throw new DomainException('Cart item quantity must be at least 1');
    }
    return new CartItem(
      undefined!,
      props.cartId,
      props.productId,
      props.quantity,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    cartId: string;
    productId: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
  }): CartItem {
    return new CartItem(
      props.id,
      props.cartId,
      props.productId,
      props.quantity,
      props.createdAt,
      props.updatedAt,
    );
  }

  get cartId(): string {
    return this._cartId;
  }
  get productId(): string {
    return this._productId;
  }
  get quantity(): number {
    return this._quantity;
  }

  updateQuantity(quantity: number): void {
    if (quantity < 1) {
      throw new DomainException('Cart item quantity must be at least 1');
    }
    this._quantity = quantity;
    this.markUpdated();
  }

  addQuantity(quantity: number): void {
    this._quantity += quantity;
    this.markUpdated();
  }
}
