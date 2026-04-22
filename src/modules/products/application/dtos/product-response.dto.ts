import { type Product } from '../../domain/entities/product.entity';

export class ProductResponseDto {
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
  createdAt: string;
  updatedAt: string;

  constructor(product: Product) {
    this.id = product.id;
    this.name = product.name;
    this.slug = product.slug;
    this.description = product.description;
    this.price = product.price;
    this.compareAtPrice = product.compareAtPrice;
    this.sku = product.sku;
    this.stock = product.stock;
    this.images = product.images;
    this.categoryId = product.categoryId;
    this.isActive = product.isActive;
    this.averageRating = product.averageRating;
    this.totalReviews = product.totalReviews;
    this.createdAt = product.createdAt.toISOString();
    this.updatedAt = product.updatedAt.toISOString();
  }
}
