import { Category } from '../../domain/entities/category.entity.js';
import { CategoryOrmEntity } from '../orm-entities/category.orm-entity.js';

export class CategoryMapper {
  static toDomain(orm: CategoryOrmEntity): Category {
    return Category.reconstitute({
      id: orm.id,
      name: orm.name,
      slug: orm.slug,
      description: orm.description,
      parentId: orm.parentId,
      isActive: orm.isActive,
      sortOrder: orm.sortOrder,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Category): CategoryOrmEntity {
    const orm = new CategoryOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.slug = domain.slug;
    orm.description = domain.description;
    orm.parentId = domain.parentId;
    orm.isActive = domain.isActive;
    orm.sortOrder = domain.sortOrder;
    return orm;
  }
}
