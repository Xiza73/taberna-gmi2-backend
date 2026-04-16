# Phase 3: Categories — Changelog

**Date**: 2026-04-15
**Status**: Completed

## Overview

Hierarchical categories module (parent/child) for organizing products. Full DDD module with 4 layers following Clean Architecture.

## Files Created (16)

### Domain Layer (2)
| File | Description |
|------|-------------|
| `src/modules/categories/domain/entities/category.entity.ts` | Category entity with create/reconstitute/update, fields: name, slug, description?, parentId?, isActive, sortOrder |
| `src/modules/categories/domain/interfaces/category-repository.interface.ts` | `ICategoryRepository` interface + `CATEGORY_REPOSITORY` Symbol token |

### Infrastructure Layer (3)
| File | Description |
|------|-------------|
| `src/modules/categories/infrastructure/orm-entities/category.orm-entity.ts` | TypeORM entity, self-referencing ManyToOne for parent, idx_categories_parent_id index |
| `src/modules/categories/infrastructure/mappers/category.mapper.ts` | Static toDomain/toOrm mapper using reconstitute() |
| `src/modules/categories/infrastructure/repositories/category.repository.ts` | Full repository: CRUD, findAllActive, findAll (paginated), hasProducts, hasSubcategories, slugExists, withTransaction |

### Application Layer — DTOs (4)
| File | Description |
|------|-------------|
| `src/modules/categories/application/dtos/create-category.dto.ts` | Input DTO: name (required), slug (required), description?, parentId?, isActive?, sortOrder? |
| `src/modules/categories/application/dtos/update-category.dto.ts` | Input DTO: all fields optional for partial update, supports null for description/parentId |
| `src/modules/categories/application/dtos/category-response.dto.ts` | Output DTO: constructor pattern, dates as ISO strings |
| `src/modules/categories/application/dtos/category-query.dto.ts` | Query DTO: extends PaginationDto, adds includeInactive boolean |

### Application Layer — Use Cases (7)
| File | Description |
|------|-------------|
| `list-categories.use-case.ts` | Public: returns all active categories ordered by sortOrder, name |
| `get-category-by-slug.use-case.ts` | Public: find by slug, validates isActive, throws 404 if not found/inactive |
| `admin-list-categories.use-case.ts` | Admin: paginated list, optional includeInactive filter |
| `admin-get-category.use-case.ts` | Admin: find by ID, throws 404 if not found |
| `create-category.use-case.ts` | Admin: validates slug uniqueness (409), validates parent exists if parentId provided |
| `update-category.use-case.ts` | Admin: validates slug uniqueness excluding self, validates parent exists, prevents self-referencing parentId |
| `delete-category.use-case.ts` | Admin: validates no products (400), no subcategories (400) before deletion |

### Presentation Layer (2)
| File | Description |
|------|-------------|
| `src/modules/categories/presentation/categories.controller.ts` | Public controller: GET /categories, GET /categories/:slug — @Public() |
| `src/modules/categories/presentation/admin-categories.controller.ts` | Admin controller: GET/POST/PATCH/DELETE on /admin/categories — @Roles('admin') |

### Module (1)
| File | Description |
|------|-------------|
| `src/modules/categories/categories.module.ts` | Module: registers ORM entity, repository via Symbol, 7 use cases, 2 controllers, exports CATEGORY_REPOSITORY |

## Files Modified (1)

| File | Change |
|------|--------|
| `src/app.module.ts` | Added CategoriesModule import |

## Endpoints

### Public (2)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/categories` | @Public | List active categories (sorted by sortOrder, name) |
| GET | `/categories/:slug` | @Public | Category detail by slug (active only) |

### Admin (5)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/categories` | admin | Paginated list (includeInactive option) |
| GET | `/admin/categories/:id` | admin | Category detail by ID |
| POST | `/admin/categories` | admin | Create category |
| PATCH | `/admin/categories/:id` | admin | Update category |
| DELETE | `/admin/categories/:id` | admin | Delete (validates no products/subcategories) |

## Validation Corrections

| Issue | File | Fix |
|-------|------|-----|
| Public `GET /categories/:slug` returned inactive categories | `get-category-by-slug.use-case.ts` | Added `!category.isActive` check — returns 404 for inactive categories |
| `UpdateCategoryUseCase` allowed self-referencing parentId | `update-category.use-case.ts` | Added `dto.parentId === id` guard before parent existence check |

## Design Decisions

| Decision | Reason |
|----------|--------|
| Slug stored as plain `string` instead of `Slug` VO | Spec mentions "VO Slug" but slug validation/sanitization happens at DTO/use-case level. Slug VO exists at `shared/domain/value-objects/slug.vo.ts` and can be integrated later if needed. Keeps entity simpler for now. |
| `hasProducts()` queries raw `products` table | Products module not yet created (Phase 4). Repository uses raw table name to check FK constraint. Will work once products table/migration exists. |
| No `forwardRef` needed | Categories has no circular dependencies with other modules |
| `findAll` uses raw column names in QueryBuilder | Consistent with existing `UserRepository` pattern in Phase 2 |

## Build Verification

- `npx tsc --noEmit` — passes with zero errors
