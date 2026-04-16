# Phase 7: Cart + Addresses — Changelog

**Date**: 2026-04-15
**Status**: Completed

## Overview

Two customer-facing modules: shopping cart (one per user, with stock validation and subtotals) and shipping addresses (max 10, with atomic default switching).

---

## Cart Module — Files Created (16)

### Domain Layer (3)
| File | Description |
|------|-------------|
| `cart/domain/entities/cart.entity.ts` | Cart entity: userId (unique per user) |
| `cart/domain/entities/cart-item.entity.ts` | CartItem entity: cartId, productId, quantity (min 1), updateQuantity/addQuantity methods |
| `cart/domain/interfaces/cart-repository.interface.ts` | `ICartRepository` + `CART_REPOSITORY` Symbol. Custom interface (not extending IBaseRepository) with findOrCreate, item-level operations |

### Infrastructure Layer (5)
| File | Description |
|------|-------------|
| `cart.orm-entity.ts` | `@Entity('carts')`, unique userId, OneToOne→users (CASCADE), OneToMany→items |
| `cart-item.orm-entity.ts` | `@Entity('cart_items')`, unique constraint (cartId, productId), ManyToOne→cart+product (CASCADE) |
| `cart.mapper.ts` | Static toDomain/toOrm for Cart |
| `cart-item.mapper.ts` | Static toDomain/toOrm for CartItem |
| `cart.repository.ts` | findOrCreateByUserId, findItemsByCartId (with product relation), saveItem, removeItem, clearCart |

### Application Layer (8)
| File | Description |
|------|-------------|
| `add-cart-item.dto.ts` | productId (UUID), quantity (min 1) |
| `update-cart-item.dto.ts` | quantity (min 1) |
| `cart-response.dto.ts` | CartItemResponseDto (with product info + subtotal), CartResponseDto (items + total) |
| `get-cart.use-case.ts` | Loads cart items, filters inactive products, calculates subtotals |
| `add-cart-item.use-case.ts` | Validates stock, merges if product exists, creates otherwise |
| `update-cart-item.use-case.ts` | Ownership check (cartId match), validates stock, updates quantity |
| `remove-cart-item.use-case.ts` | Ownership check, removes item |
| `clear-cart.use-case.ts` | Validates cart not empty, clears all items |

### Presentation + Module (2)
| File | Description |
|------|-------------|
| `cart.controller.ts` | 5 JWT endpoints: GET /cart, POST /cart/items, PATCH/DELETE /cart/items/:id, DELETE /cart |
| `cart.module.ts` | Imports ProductsModule, exports CART_REPOSITORY |

---

## Addresses Module — Files Created (13)

### Domain Layer (2)
| File | Description |
|------|-------------|
| `address.entity.ts` | 12 fields: label, recipientName, phone, street, district, city, department, zipCode?, reference?, isDefault |
| `address-repository.interface.ts` | `IAddressRepository` extends IBaseRepository, adds findAllByUserId, countByUserId, setDefault |

### Infrastructure Layer (3)
| File | Description |
|------|-------------|
| `address.orm-entity.ts` | `@Entity('addresses')`, ManyToOne→users (CASCADE), index on userId |
| `address.mapper.ts` | Static toDomain/toOrm for Address |
| `address.repository.ts` | setDefault via atomic UPDATE query (parameterized, SQL-injection safe) |

### Application Layer (8)
| File | Description |
|------|-------------|
| `create-address.dto.ts` | 7 required + 2 optional fields |
| `update-address.dto.ts` | All fields optional, supports null for zipCode/reference |
| `address-response.dto.ts` | Full address DTO, createdAt as ISO string |
| `list-addresses.use-case.ts` | Returns user's addresses ordered by isDefault DESC |
| `create-address.use-case.ts` | Validates max 10 addresses per user |
| `update-address.use-case.ts` | Ownership check (ADDRESS_NOT_OWNED) |
| `delete-address.use-case.ts` | Ownership check |
| `set-default-address.use-case.ts` | Ownership check + atomic setDefault |

### Presentation + Module (2)
| File | Description |
|------|-------------|
| `addresses.controller.ts` | 5 JWT endpoints: GET, POST, PATCH, DELETE /addresses, POST /addresses/:id/default |
| `addresses.module.ts` | Exports ADDRESS_REPOSITORY |

---

## Files Modified (1)

| File | Change |
|------|--------|
| `src/app.module.ts` | Added CartModule + AddressesModule imports |

## Validation Results

| Check | Result |
|-------|--------|
| All endpoints (5 cart + 5 addresses) | ✅ PASS |
| All use cases (5 + 5) | ✅ PASS |
| Entity fields per spec | ✅ PASS |
| Unique constraint (cartId, productId) | ✅ PASS |
| Stock validation on add/update | ✅ PASS |
| Merge product if already in cart | ✅ PASS |
| Filter inactive products in GET | ✅ PASS |
| Calculate subtotals and total | ✅ PASS |
| Cart ownership check | ✅ PASS |
| Address ownership check (ADDRESS_NOT_OWNED) | ✅ PASS |
| Max 10 addresses limit | ✅ PASS |
| setDefault atomic + SQL-injection safe | ✅ PASS |
| CLAUDE.md conventions | ✅ PASS |
| Architecture layer boundaries | ✅ PASS |
| TypeScript compilation | ✅ PASS |

**0 bugs found.**

## Pre-validation Fixes (proactive)

| Issue | File | Fix |
|-------|------|-----|
| SQL injection in setDefault (string interpolation) | `address.repository.ts` | Changed to parameterized `setParameter('addressId', addressId)` |
| userId as `@PrimaryColumn` (composite PK) | `cart.orm-entity.ts` | Changed to `@Column` with unique index |
| Duplicate Cart import aliases | `cart.repository.ts` | Simplified to single `Cart` import |

## Build Verification

- `npx tsc --noEmit` — passes with zero errors
