# Phase 8: Wishlist — Changelog

**Date**: 2026-04-15
**Status**: Completed

## Overview

Customer wishlist module: simple user-product relationship allowing users to save, list, and remove favorite products. Filters inactive products from listing.

---

## Wishlist Module — Files Created (10)

### Domain Layer (2)
| File | Description |
|------|-------------|
| `wishlist/domain/entities/wishlist-item.entity.ts` | WishlistItem entity: userId, productId |
| `wishlist/domain/interfaces/wishlist-repository.interface.ts` | `IWishlistRepository` + `WISHLIST_REPOSITORY` Symbol. Methods: findAllByUserId, findByUserAndProduct, save, deleteByUserAndProduct |

### Infrastructure Layer (3)
| File | Description |
|------|-------------|
| `wishlist-item.orm-entity.ts` | `@Entity('wishlist_items')`, unique constraint (userId, productId), ManyToOne→users+products (CASCADE), index on userId |
| `wishlist-item.mapper.ts` | Static toDomain/toOrm for WishlistItem |
| `wishlist.repository.ts` | findAllByUserId (ordered by createdAt DESC), findByUserAndProduct, save, deleteByUserAndProduct |

### Application Layer (4)
| File | Description |
|------|-------------|
| `wishlist-response.dto.ts` | WishlistItemResponseDto with product info (name, slug, image, price) + addedAt |
| `list-wishlist.use-case.ts` | Loads wishlist items, filters inactive products, maps to DTOs |
| `add-to-wishlist.use-case.ts` | Validates product exists and is active, checks duplicate → DomainConflictException |
| `remove-from-wishlist.use-case.ts` | Validates item exists → DomainNotFoundException if not found, then deletes |

### Presentation + Module (2)
| File | Description |
|------|-------------|
| `wishlist.controller.ts` | 3 JWT endpoints: GET /wishlist, POST /wishlist/:productId, DELETE /wishlist/:productId |
| `wishlist.module.ts` | Imports ProductsModule, exports WISHLIST_REPOSITORY |

---

## Files Modified (1)

| File | Change |
|------|--------|
| `src/app.module.ts` | Added WishlistModule import |

## Validation Results

| Check | Result |
|-------|--------|
| All endpoints (3) | ✅ PASS |
| All use cases (3) | ✅ PASS |
| Entity fields per spec (id, userId, productId) | ✅ PASS |
| Unique constraint (userId, productId) | ✅ PASS |
| Filter inactive products in GET | ✅ PASS |
| Product existence + active validation on add | ✅ PASS |
| DomainConflictException on duplicate add | ✅ PASS |
| DomainNotFoundException on remove non-existent | ✅ PASS |
| ErrorMessages constants used | ✅ PASS |
| CLAUDE.md conventions | ✅ PASS |
| Architecture layer boundaries | ✅ PASS |
| Module imports/exports correct | ✅ PASS |
| AppModule includes WishlistModule | ✅ PASS |
| TypeScript compilation | ✅ PASS |

**0 bugs found.**

## Build Verification

- `npx tsc --noEmit` — passes with zero errors
