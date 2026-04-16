# Phase 4: Products — Changelog

**Date**: 2026-04-15
**Status**: Completed

## Overview

Full DDD Products module with dynamic filtering, soft delete, SKU/slug uniqueness, category validation, and optional Elasticsearch sync interface for future integration.

## Files Created (21)

### Domain Layer (3)
| File | Description |
|------|-------------|
| `src/modules/products/domain/entities/product.entity.ts` | Product entity: 13 fields, create/reconstitute/update/adjustStock/deactivate/updateRating methods |
| `src/modules/products/domain/interfaces/product-repository.interface.ts` | `IProductRepository` + `PRODUCT_REPOSITORY` Symbol, includes findAll with dynamic filters, slugExists, skuExists |
| `src/modules/products/domain/interfaces/product-search-sync.interface.ts` | `IProductSearchSync` + `PRODUCT_SEARCH_SYNC` Symbol for ES integration (Phase 16) |

### Infrastructure Layer (3)
| File | Description |
|------|-------------|
| `src/modules/products/infrastructure/orm-entities/product.orm-entity.ts` | TypeORM entity, FK→categories (RESTRICT), jsonb images, decimal averageRating, indexes on category_id and slug |
| `src/modules/products/infrastructure/mappers/product.mapper.ts` | Static toDomain/toOrm, handles decimal→number conversion for averageRating |
| `src/modules/products/infrastructure/repositories/product.repository.ts` | Dynamic query builder: categoryId, minPrice, maxPrice, ILIKE search, 5 sort options (price/price_desc/name/newest/rating) |

### Application Layer — DTOs (5)
| File | Description |
|------|-------------|
| `create-product.dto.ts` | name, slug, description, price (required), categoryId (required), optional: compareAtPrice, sku, stock, images |
| `update-product.dto.ts` | All fields optional, supports null for compareAtPrice/sku |
| `product-response.dto.ts` | Full product DTO with all 15 fields, dates as ISO strings |
| `product-query.dto.ts` | Extends PaginationDto: categoryId, minPrice, maxPrice, search, sortBy, includeInactive |
| `adjust-stock.dto.ts` | quantity (integer, can be negative to decrease stock) |

### Application Layer — Use Cases (8)
| File | Description |
|------|-------------|
| `list-products.use-case.ts` | Public: filtered+paginated, active only |
| `get-product-by-slug.use-case.ts` | Public: by slug, validates isActive |
| `admin-list-products.use-case.ts` | Admin: includes inactive by default (`includeInactive ?? true`) |
| `admin-get-product.use-case.ts` | Admin: by ID, no isActive filter |
| `create-product.use-case.ts` | Validates slug/sku uniqueness + category exists, optional ES sync |
| `update-product.use-case.ts` | Validates slug/sku uniqueness (excludeId) + category exists, optional ES sync |
| `delete-product.use-case.ts` | Soft delete via `deactivate()`, removes from ES index |
| `adjust-stock.use-case.ts` | Adjusts stock by quantity (positive/negative), domain validates no negative result |

### Presentation Layer (2)
| File | Description |
|------|-------------|
| `src/modules/products/presentation/products.controller.ts` | Public: GET /products, GET /products/:slug — @Public() |
| `src/modules/products/presentation/admin-products.controller.ts` | Admin: 6 endpoints including PATCH :id/stock — @Roles('admin') |

### Module (1)
| File | Description |
|------|-------------|
| `src/modules/products/products.module.ts` | Imports CategoriesModule for cross-module CATEGORY_REPOSITORY, exports PRODUCT_REPOSITORY |

## Files Modified (1)

| File | Change |
|------|--------|
| `src/app.module.ts` | Added ProductsModule import |

## Endpoints

### Public (2)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/products` | @Public | Filtered + paginated list (active only) |
| GET | `/products/:slug` | @Public | Product detail (active only) |

### Admin (6)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/products` | admin | Paginated list (includes inactive by default) |
| GET | `/admin/products/:id` | admin | Product detail by ID |
| POST | `/admin/products` | admin | Create product |
| PATCH | `/admin/products/:id` | admin | Update product |
| DELETE | `/admin/products/:id` | admin | Soft delete (deactivate + remove from ES) |
| PATCH | `/admin/products/:id/stock` | admin | Adjust stock by quantity |

## Validation Corrections

| Issue | File | Fix |
|-------|------|-----|
| Admin list didn't include inactive products by default | `admin-list-products.use-case.ts` | Changed `includeInactive: query.includeInactive` → `query.includeInactive ?? true` |
| Import order: `@modules` after relative imports | `create-product.use-case.ts` | Moved `@modules/categories` import before relative imports |
| Import order: `@modules` after relative imports | `update-product.use-case.ts` | Moved `@modules/categories` import before relative imports |
| `averageRating` of 0 mapped to null | `product.mapper.ts` | Changed `orm.averageRating ?` → `orm.averageRating !== null ?` |

## Design Decisions

| Decision | Reason |
|----------|--------|
| Price as plain `number` instead of `Money` VO | Consistent with Phase 3 Slug VO decision. Validation in `Product.create()` ensures non-negative integer (cents). |
| `@Optional() @Inject(PRODUCT_SEARCH_SYNC)` | SearchModule not imported until Phase 16. Optional injection prevents circular deps. |
| Soft delete via `deactivate()` | Spec says "soft: isActive=false". No hard delete. |
| Cart/wishlist cleanup deferred | Spec mentions cleanup on delete, but Cart/Wishlist modules don't exist yet (Phases 7-8). Will be added when those modules are implemented. |
| `onDelete: 'RESTRICT'` on category FK | Prevents deleting a category that has products (complementary to `hasProducts()` check in Phase 3). |
| `NULLS LAST` on rating sort | Products without reviews (null rating) appear last when sorting by rating. |

## Build Verification

- `npx tsc --noEmit` — passes with zero errors
