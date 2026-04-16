import { BaseEntity } from '@shared/domain/entities/base.entity.js';

export class OrderItem extends BaseEntity {
  private _orderId: string;
  private _productId: string;
  private _productName: string;
  private _productSlug: string;
  private _productImage: string | null;
  private _unitPrice: number;
  private _quantity: number;
  private _subtotal: number;

  private constructor(
    id: string,
    orderId: string,
    productId: string,
    productName: string,
    productSlug: string,
    productImage: string | null,
    unitPrice: number,
    quantity: number,
    subtotal: number,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._orderId = orderId;
    this._productId = productId;
    this._productName = productName;
    this._productSlug = productSlug;
    this._productImage = productImage;
    this._unitPrice = unitPrice;
    this._quantity = quantity;
    this._subtotal = subtotal;
  }

  static create(props: {
    orderId: string;
    productId: string;
    productName: string;
    productSlug: string;
    productImage: string | null;
    unitPrice: number;
    quantity: number;
  }): OrderItem {
    return new OrderItem(
      undefined!,
      props.orderId,
      props.productId,
      props.productName,
      props.productSlug,
      props.productImage,
      props.unitPrice,
      props.quantity,
      props.unitPrice * props.quantity,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    productSlug: string;
    productImage: string | null;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    createdAt: Date;
    updatedAt: Date;
  }): OrderItem {
    return new OrderItem(
      props.id,
      props.orderId,
      props.productId,
      props.productName,
      props.productSlug,
      props.productImage,
      props.unitPrice,
      props.quantity,
      props.subtotal,
      props.createdAt,
      props.updatedAt,
    );
  }

  get orderId(): string {
    return this._orderId;
  }
  get productId(): string {
    return this._productId;
  }
  get productName(): string {
    return this._productName;
  }
  get productSlug(): string {
    return this._productSlug;
  }
  get productImage(): string | null {
    return this._productImage;
  }
  get unitPrice(): number {
    return this._unitPrice;
  }
  get quantity(): number {
    return this._quantity;
  }
  get subtotal(): number {
    return this._subtotal;
  }
}
