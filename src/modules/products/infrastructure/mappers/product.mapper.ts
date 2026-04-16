import { Product } from '../../domain/entities/product.entity.js';
import { ProductOrmEntity } from '../orm-entities/product.orm-entity.js';

export class ProductMapper {
  static toDomain(orm: ProductOrmEntity): Product {
    return Product.reconstitute({
      id: orm.id,
      name: orm.name,
      slug: orm.slug,
      description: orm.description,
      price: orm.price,
      compareAtPrice: orm.compareAtPrice,
      sku: orm.sku,
      stock: orm.stock,
      images: orm.images,
      categoryId: orm.categoryId,
      isActive: orm.isActive,
      averageRating:
        orm.averageRating !== null ? Number(orm.averageRating) : null,
      totalReviews: orm.totalReviews,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Product): ProductOrmEntity {
    const orm = new ProductOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.slug = domain.slug;
    orm.description = domain.description;
    orm.price = domain.price;
    orm.compareAtPrice = domain.compareAtPrice;
    orm.sku = domain.sku;
    orm.stock = domain.stock;
    orm.images = domain.images;
    orm.categoryId = domain.categoryId;
    orm.isActive = domain.isActive;
    orm.averageRating = domain.averageRating;
    orm.totalReviews = domain.totalReviews;
    return orm;
  }
}
