# Phase 5: Banners — Changelog

**Date**: 2026-04-15
**Status**: Completed

## Overview

Promotional banners module with position-based display (hero/secondary/footer), date-range validity, and admin CRUD. Full DDD module with 4 layers.

## Files Created (17)

### Domain Layer (3)
| File | Description |
|------|-------------|
| `src/modules/banners/domain/entities/banner.entity.ts` | Banner entity: 9 fields, create/reconstitute/update methods |
| `src/modules/banners/domain/enums/banner-position.enum.ts` | `BannerPosition` enum: HERO, SECONDARY, FOOTER |
| `src/modules/banners/domain/interfaces/banner-repository.interface.ts` | `IBannerRepository` + `BANNER_REPOSITORY` Symbol, findAllActive (date-filtered), findAll (paginated) |

### Infrastructure Layer (3)
| File | Description |
|------|-------------|
| `src/modules/banners/infrastructure/orm-entities/banner.orm-entity.ts` | TypeORM entity, enum column for position, timestamptz for start/end dates |
| `src/modules/banners/infrastructure/mappers/banner.mapper.ts` | Static toDomain/toOrm mapper |
| `src/modules/banners/infrastructure/repositories/banner.repository.ts` | findAllActive filters: isActive + startDate <= now + endDate >= now, ordered by sortOrder |

### Application Layer — DTOs (3)
| File | Description |
|------|-------------|
| `create-banner.dto.ts` | title, imageUrl (required), position (enum), optional: linkUrl, isActive, sortOrder, startDate, endDate |
| `update-banner.dto.ts` | All fields optional, supports null for linkUrl/startDate/endDate |
| `banner-response.dto.ts` | Full banner DTO, dates as ISO strings |

### Application Layer — Use Cases (6)
| File | Description |
|------|-------------|
| `list-active-banners.use-case.ts` | Public: returns active + date-valid banners |
| `admin-list-banners.use-case.ts` | Admin: paginated, includeInactive: true |
| `admin-get-banner.use-case.ts` | Admin: by ID, throws 404 |
| `create-banner.use-case.ts` | Creates banner, converts date strings to Date objects |
| `update-banner.use-case.ts` | Partial update, handles date string→Date conversion |
| `delete-banner.use-case.ts` | Hard delete after existence check |

### Presentation Layer (2)
| File | Description |
|------|-------------|
| `src/modules/banners/presentation/banners.controller.ts` | Public: GET /banners — @Public() |
| `src/modules/banners/presentation/admin-banners.controller.ts` | Admin: 5 endpoints — @Roles('admin') |

### Module (1)
| File | Description |
|------|-------------|
| `src/modules/banners/banners.module.ts` | Registers ORM entity, repository via Symbol, 6 use cases, 2 controllers, exports BANNER_REPOSITORY |

## Files Modified (1)

| File | Change |
|------|--------|
| `src/app.module.ts` | Added BannersModule import |

## Endpoints

### Public (1)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/banners` | @Public | List active + date-valid banners (sorted by sortOrder) |

### Admin (5)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/banners` | admin | Paginated list (all banners) |
| GET | `/admin/banners/:id` | admin | Banner detail |
| POST | `/admin/banners` | admin | Create banner |
| PATCH | `/admin/banners/:id` | admin | Update banner |
| DELETE | `/admin/banners/:id` | admin | Delete banner |

## Validation Results

| Check | Result |
|-------|--------|
| Spec compliance (fields, endpoints, use cases) | ✅ PASS |
| CLAUDE.md conventions | ✅ PASS |
| Architecture rules (layer boundaries) | ✅ PASS |
| Enum pattern (UPPER_SNAKE = 'lower_snake') | ✅ PASS |
| Date handling (timestamptz, validity filter) | ✅ PASS |
| Pattern consistency with Phases 2-4 | ✅ PASS |
| Module wiring | ✅ PASS |
| TypeScript compilation | ✅ PASS |

**0 bugs found. 0 corrections needed.**

## Design Decisions

| Decision | Reason |
|----------|--------|
| Hard delete for banners (not soft) | Spec says "Eliminar banner" without soft delete mention. Banners have no FK dependencies. |
| Public list uses `findAllActive()` with date filtering | Filters by isActive + startDate/endDate validity at repository level |
| Admin list always includes inactive | Admin needs full visibility, `includeInactive: true` hardcoded |
| `@IsDateString()` for date inputs | Accepts ISO 8601 strings, converted to `Date` in use case layer |

## Build Verification

- `npx tsc --noEmit` — passes with zero errors
