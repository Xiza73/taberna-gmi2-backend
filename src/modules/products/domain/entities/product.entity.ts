import { BaseEntity } from '@shared/domain/entities/base.entity';
import { DomainException } from '@shared/domain/exceptions/index';

export class Product extends BaseEntity {
  private _name: string;
  private _slug: string;
  private _description: string;
  private _price: number;
  private _compareAtPrice: number | null;
  private _sku: string | null;
  private _stock: number;
  private _images: string[];
  private _categoryId: string;
  private _isActive: boolean;
  private _averageRating: number | null;
  private _totalReviews: number;

  private constructor(
    id: string,
    name: string,
    slug: string,
    description: string,
    price: number,
    compareAtPrice: number | null,
    sku: string | null,
    stock: number,
    images: string[],
    categoryId: string,
    isActive: boolean,
    averageRating: number | null,
    totalReviews: number,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._name = name;
    this._slug = slug;
    this._description = description;
    this._price = price;
    this._compareAtPrice = compareAtPrice;
    this._sku = sku;
    this._stock = stock;
    this._images = images;
    this._categoryId = categoryId;
    this._isActive = isActive;
    this._averageRating = averageRating;
    this._totalReviews = totalReviews;
  }

  static create(props: {
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    sku?: string | null;
    stock?: number;
    images?: string[];
    categoryId: string;
  }): Product {
    if (!props.name || !props.slug) {
      throw new DomainException('Product requires name and slug');
    }
    if (!Number.isInteger(props.price) || props.price < 0) {
      throw new DomainException('Price must be a non-negative integer (cents)');
    }
    if (props.compareAtPrice !== undefined && props.compareAtPrice !== null) {
      if (!Number.isInteger(props.compareAtPrice) || props.compareAtPrice < 0) {
        throw new DomainException(
          'Compare-at price must be a non-negative integer (cents)',
        );
      }
    }
    return new Product(
      undefined!,
      props.name,
      props.slug,
      props.description,
      props.price,
      props.compareAtPrice ?? null,
      props.sku ?? null,
      props.stock ?? 0,
      props.images ?? [],
      props.categoryId,
      true,
      null,
      0,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice: number | null;
    sku: string | null;
    stock: number;
    images: string[];
    categoryId: string;
    isActive: boolean;
    averageRating: number | null;
    totalReviews: number;
    createdAt: Date;
    updatedAt: Date;
  }): Product {
    return new Product(
      props.id,
      props.name,
      props.slug,
      props.description,
      props.price,
      props.compareAtPrice,
      props.sku,
      props.stock,
      props.images,
      props.categoryId,
      props.isActive,
      props.averageRating,
      props.totalReviews,
      props.createdAt,
      props.updatedAt,
    );
  }

  get name(): string {
    return this._name;
  }
  get slug(): string {
    return this._slug;
  }
  get description(): string {
    return this._description;
  }
  get price(): number {
    return this._price;
  }
  get compareAtPrice(): number | null {
    return this._compareAtPrice;
  }
  get sku(): string | null {
    return this._sku;
  }
  get stock(): number {
    return this._stock;
  }
  get images(): string[] {
    return [...this._images];
  }
  get categoryId(): string {
    return this._categoryId;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get averageRating(): number | null {
    return this._averageRating;
  }
  get totalReviews(): number {
    return this._totalReviews;
  }

  update(props: {
    name?: string;
    slug?: string;
    description?: string;
    price?: number;
    compareAtPrice?: number | null;
    sku?: string | null;
    stock?: number;
    images?: string[];
    categoryId?: string;
    isActive?: boolean;
  }): void {
    if (props.name !== undefined) this._name = props.name;
    if (props.slug !== undefined) this._slug = props.slug;
    if (props.description !== undefined) this._description = props.description;
    if (props.price !== undefined) this._price = props.price;
    if (props.compareAtPrice !== undefined)
      this._compareAtPrice = props.compareAtPrice;
    if (props.sku !== undefined) this._sku = props.sku;
    if (props.stock !== undefined) this._stock = props.stock;
    if (props.images !== undefined) this._images = props.images;
    if (props.categoryId !== undefined) this._categoryId = props.categoryId;
    if (props.isActive !== undefined) this._isActive = props.isActive;
    this.markUpdated();
  }

  adjustStock(quantity: number): void {
    const newStock = this._stock + quantity;
    if (newStock < 0) {
      throw new DomainException('Insufficient stock');
    }
    this._stock = newStock;
    this.markUpdated();
  }

  deactivate(): void {
    this._isActive = false;
    this.markUpdated();
  }

  updateRating(averageRating: number | null, totalReviews: number): void {
    this._averageRating = averageRating;
    this._totalReviews = totalReviews;
    this.markUpdated();
  }
}
