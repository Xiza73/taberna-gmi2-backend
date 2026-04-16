# Phase 14: Reviews — Changelog

**Date**: 2026-04-15
**Status**: Completed

## Overview

Product reviews module. Customers can review purchased products (delivered orders only). Admin approves/rejects reviews. Approved reviews recalculate product averageRating and totalReviews. XSS sanitization on comments.

---

## Reviews Module — Files Created (14)

### Domain Layer (2)
| File | Description |
|------|-------------|
| `review.entity.ts` | 6 fields: userId, productId, orderId, rating (1-5), comment?, isApproved (default false). `create()`, `reconstitute()`, `approve()` |
| `review-repository.interface.ts` | REVIEW_REPOSITORY Symbol. Extends IBaseRepository + findByUserAndProduct, findApprovedByProductId, findPending, countApprovedByProductId, averageRatingByProductId |

### Infrastructure Layer (3)
| File | Description |
|------|-------------|
| `review.orm-entity.ts` | `reviews` table. Unique index (user_id, product_id). Index on product_id. snake_case columns |
| `review.mapper.ts` | Static toDomain/toOrm |
| `review.repository.ts` | All interface methods. AVG SQL aggregation for rating. withTransaction |

### Application Layer (7)
| File | Description |
|------|-------------|
| `create-review.dto.ts` | @IsInt @Min(1) @Max(5) rating, @IsOptional @MaxLength(2000) comment |
| `review-response.dto.ts` | Constructor pattern, dates to ISO |
| `create-review.use-case.ts` | Validates product exists, unique per user, finds delivered order with product, sanitizes HTML from comment |
| `list-product-reviews.use-case.ts` | Validates product exists, returns approved reviews paginated |
| `admin-list-pending-reviews.use-case.ts` | Returns pending reviews paginated (oldest first) |
| `approve-review.use-case.ts` | Approves review, recalculates product averageRating + totalReviews |
| `delete-review.use-case.ts` | Deletes review, recalculates rating if was approved |

### Presentation + Module (3)
| File | Description |
|------|-------------|
| `reviews.controller.ts` | POST /products/:id/reviews (JWT), GET /products/:id/reviews (@Public, paginated) |
| `admin-reviews.controller.ts` | GET /admin/reviews (pending, paginated), POST /admin/reviews/:id/approve, DELETE /admin/reviews/:id — all @Roles('admin') |
| `reviews.module.ts` | Imports ProductsModule + OrdersModule, exports REVIEW_REPOSITORY |

---

## Files Modified (1)

| File | Change |
|------|--------|
| `src/app.module.ts` | Added ReviewsModule import |

## Validation Results

| Check | Result |
|-------|--------|
| Review entity (6 fields + id, rating validation) | ✅ PASS |
| IReviewRepository + REVIEW_REPOSITORY Symbol | ✅ PASS |
| ORM entity (unique user+product, snake_case) | ✅ PASS |
| Mapper (toDomain/toOrm) | ✅ PASS |
| Repository (all methods, withTransaction) | ✅ PASS |
| DTOs (validation decorators, constructor pattern) | ✅ PASS |
| CreateReviewUseCase (ownership + HTML sanitization) | ✅ PASS |
| ListProductReviewsUseCase (approved only) | ✅ PASS |
| AdminListPendingReviewsUseCase (pending, paginated) | ✅ PASS |
| ApproveReviewUseCase (recalculates product rating) | ✅ PASS |
| DeleteReviewUseCase (recalculates if approved) | ✅ PASS |
| Customer endpoints (2 routes correct) | ✅ PASS |
| Admin endpoints (3 routes @Roles admin) | ✅ PASS |
| Module imports/exports | ✅ PASS |
| AppModule includes ReviewsModule | ✅ PASS |
| Cross-module: Product.updateRating() called | ✅ PASS |
| CLAUDE.md conventions | ✅ PASS |

**0 bugs found.**

## Build Verification

- `npx tsc --noEmit` — passes with zero errors
