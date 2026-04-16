# Phase 9: Coupons — Changelog

**Date**: 2026-04-15
**Status**: Completed

## Overview

Discount coupons module with admin CRUD and customer validation endpoint. Supports percentage and fixed-amount types, with atomic usage tracking, pessimistic locking for checkout, and a pure domain service for discount calculation.

---

## Coupons Module — Files Created (17)

### Domain Layer (4)
| File | Description |
|------|-------------|
| `coupon-type.enum.ts` | `CouponType` enum: PERCENTAGE = 'percentage', FIXED_AMOUNT = 'fixed_amount' |
| `coupon.entity.ts` | Coupon entity: 12 fields (code unique uppercase, type, value, minPurchase?, maxDiscount?, maxUses?, maxUsesPerUser? default 1, currentUses default 0, isActive, startDate, endDate). `update()` method |
| `coupon-repository.interface.ts` | `ICouponRepository` extends IBaseRepository. Adds: findByCode, codeExists, findAll, findByIdForUpdate (pessimistic lock), incrementUses (atomic), decrementUses (atomic with floor) |
| `coupon-calculator.ts` | Domain service + `COUPON_CALCULATOR` Symbol. `validate()`: checks active, dates, uses, minPurchase. `calculateDiscount()`: percentage with maxDiscount cap, fixed_amount, never exceeds subtotal |

### Infrastructure Layer (3)
| File | Description |
|------|-------------|
| `coupon.orm-entity.ts` | `@Entity('coupons')`, unique code index, enum type column, all snake_case columns, correct defaults |
| `coupon.mapper.ts` | Static toDomain/toOrm for Coupon |
| `coupon.repository.ts` | findByCode (uppercase), codeExists (excludeId), findAll paginated, findByIdForUpdate (setLock pessimistic_write), incrementUses (atomic + condition), decrementUses (atomic + floor) |

### Application Layer (10)
| File | Description |
|------|-------------|
| `create-coupon.dto.ts` | Input DTO with validators, code required, type enum, dates required |
| `update-coupon.dto.ts` | All fields optional, supports null for minPurchase/maxDiscount/maxUses/maxUsesPerUser |
| `validate-coupon.dto.ts` | code (string) + subtotal (integer min 0) |
| `coupon-response.dto.ts` | CouponResponseDto (full fields) + CouponValidationResponseDto (couponId, code, type, discount) |
| `validate-coupon.use-case.ts` | Finds by code, validates via CouponCalculator, returns discount preview |
| `admin-list-coupons.use-case.ts` | Paginated list, returns PaginatedResponseDto |
| `admin-get-coupon.use-case.ts` | Find by ID, throws COUPON_NOT_FOUND if missing |
| `create-coupon.use-case.ts` | Validates code uniqueness, creates entity |
| `update-coupon.use-case.ts` | Validates code uniqueness excluding self, updates entity |
| `delete-coupon.use-case.ts` | Validates exists, deletes |

### Presentation + Module (3)
| File | Description |
|------|-------------|
| `coupons.controller.ts` | 1 JWT endpoint: POST /coupons/validate |
| `admin-coupons.controller.ts` | 5 admin endpoints: GET, GET/:id, POST, PATCH/:id, DELETE/:id — all @Roles('admin') |
| `coupons.module.ts` | Registers CouponCalculator as useValue, exports COUPON_REPOSITORY + COUPON_CALCULATOR |

---

## Files Modified (1)

| File | Change |
|------|--------|
| `src/app.module.ts` | Added CouponsModule import |

## Validation Results

| Check | Result |
|-------|--------|
| All endpoints (6: 1 public + 5 admin) | ✅ PASS |
| All use cases (6) | ✅ PASS |
| Entity fields per spec (12 fields) | ✅ PASS |
| CouponType enum correct | ✅ PASS |
| CouponCalculator validates: active, dates, uses, minPurchase | ✅ PASS |
| calculateDiscount: % with cap, fixed, never > subtotal | ✅ PASS |
| Repository: findByCode, codeExists, findAll, findByIdForUpdate, incrementUses, decrementUses | ✅ PASS |
| ORM entity columns + types + unique index | ✅ PASS |
| Validate endpoint returns discount preview | ✅ PASS |
| Admin endpoints @Roles('admin') | ✅ PASS |
| Code uniqueness on create | ✅ PASS |
| Code uniqueness on update (excluding self) | ✅ PASS |
| ErrorMessages constants used | ✅ PASS |
| CLAUDE.md conventions | ✅ PASS |
| Module exports + domain service registration | ✅ PASS |
| AppModule includes CouponsModule | ✅ PASS |

**0 bugs found.**

## Build Verification

- `npx tsc --noEmit` — passes with zero errors
