# Phase 11: Orders — Changelog

**Date**: 2026-04-15
**Status**: Completed

## Overview

Full order lifecycle module. Cart-to-checkout flow with transactional integrity, MercadoPago payment integration, webhook processing with HMAC verification, automatic order expiration cron, and admin management.

---

## Orders Module — Files Created (35)

### Domain Layer (6)
| File | Description |
|------|-------------|
| `order-status.enum.ts` | 7 values: pending, paid, processing, shipped, delivered, cancelled, refunded |
| `order.entity.ts` | 16 domain fields + shippingAddressSnapshot (jsonb). State machine via `transitionTo()` with validated transitions. `updateNotes()` method |
| `order-item.entity.ts` | 8 fields: orderId, productId, productName, productSlug, productImage, unitPrice, quantity, subtotal |
| `order-event.entity.ts` | 5 fields: orderId, status, description, performedBy?, metadata? |
| `order-repository.interface.ts` | IOrderRepository: CRUD + findByIdWithDetails, findAllByUserId, findAll (admin filters), saveItem, saveEvent, atomicStatusTransition, atomicStockDecrement/Restore, findPendingExpired, countUserOrdersWithCoupon |
| `order-number-generator.interface.ts` | IOrderNumberGenerator + ORDER_NUMBER_GENERATOR Symbol |

### Infrastructure Layer (10)
| File | Description |
|------|-------------|
| `order.orm-entity.ts` | 3 indexes: user_id, user_coupon (partial), pending_created (partial) |
| `order-item.orm-entity.ts` | ManyToOne→orders (CASCADE), order_id index |
| `order-event.orm-entity.ts` | ManyToOne→orders (CASCADE), order_id index, enum status |
| `order.mapper.ts` | Static toDomain/toOrm |
| `order-item.mapper.ts` | Static toDomain/toOrm |
| `order-event.mapper.ts` | Static toDomain/toOrm |
| `order.repository.ts` | Injects 3 repos, parameterized atomic stock queries, withTransaction clones all 3 repos |
| `order-number-generator.ts` | Table-based counter: INSERT ON CONFLICT, format ORD-YYYYMMDD-NNN |
| `order-expiration.cron.ts` | @Cron every 15 min, delegates to ExpireUnpaidOrdersUseCase |

### Application Layer (18)
| File | Description |
|------|-------------|
| `create-order.dto.ts` | addressId (UUID), couponCode?, notes? |
| `order-query.dto.ts` | OrderQueryDto (status filter) + AdminOrderQueryDto (status, userId, dateFrom, dateTo, search, sortBy) |
| `update-order-status.dto.ts` | status (enum) |
| `update-order-notes.dto.ts` | adminNotes (string required) |
| `mercado-pago-notification.dto.ts` | type?, action?, data?.id? |
| `order-response.dto.ts` | OrderResponseDto + OrderItemResponseDto + OrderEventResponseDto. Supports extras: items, events, paymentUrl |
| `create-order.use-case.ts` | Checkout flow: steps 1-12 in unitOfWork, step 13 (MercadoPago) outside. Atomic stock, coupon validation with per-user check, address snapshot |
| `list-my-orders.use-case.ts` | Paginated user orders with optional status filter |
| `get-order.use-case.ts` | With items + events, ownership check |
| `cancel-order.use-case.ts` | Transactional: atomic transition, stock restore (sorted by productId), coupon decrement, OrderEvent |
| `retry-payment.use-case.ts` | Re-creates MercadoPago preference for pending orders |
| `process-payment-notification.use-case.ts` | HMAC verify, API check, amount verify, idempotency, atomic transition, late payment handling |
| `verify-payment.use-case.ts` | Fallback: queries MercadoPago, amount verify, processes in transaction |
| `expire-unpaid-orders.use-case.ts` | Batch 50, max 500, per-order transaction, atomic transition, stock restore, coupon decrement |
| `admin-list-orders.use-case.ts` | Paginated with full filter set |
| `admin-get-order.use-case.ts` | Full details (items + events) |
| `update-order-status.use-case.ts` | Uses entity `transitionTo()` for validation, creates OrderEvent with admin performedBy |
| `update-order-notes.use-case.ts` | Updates adminNotes |

### Presentation + Module (4)
| File | Description |
|------|-------------|
| `orders.controller.ts` | 6 customer endpoints: POST /orders (@Throttle 5/h), GET /orders, GET /:id, POST /:id/cancel, POST /:id/retry-payment, POST /:id/verify-payment (@Throttle 5/min) |
| `admin-orders.controller.ts` | 4 admin endpoints: GET, GET/:id, PATCH/:id/status, PATCH/:id/notes |
| `webhooks.controller.ts` | POST /webhooks/mercadopago: @Public, @Throttle(100/min), forbidNonWhitelisted: false, always returns 200 |
| `orders.module.ts` | Imports: Cart, Addresses, Products, Users, Coupons, Payments. Exports ORDER_REPOSITORY |

---

## Files Modified (1)

| File | Change |
|------|--------|
| `src/app.module.ts` | Added OrdersModule import |

## Bugs Found & Fixed

| Bug | Severity | Fix |
|-----|----------|-----|
| `atomicStockDecrement/Restore` used string interpolation in SQL | Low | Changed to parameterized queries (`$1`, `$2`) |
| `findPendingExpired` used pessimistic lock outside transaction (ineffective) | Medium | Removed lock; atomicStatusTransition already handles concurrency |
| Logger in application-layer use cases | Low (convention) | Kept as pragmatic exception — safety-critical paths (webhooks, cron, payments) require logging |

## Validation Results

| Check | Result |
|-------|--------|
| Order state machine (7 statuses, valid transitions) | ✅ PASS |
| CreateOrderUseCase (steps 1-12 in tx, 13 outside) | ✅ PASS |
| CancelOrderUseCase (atomic + stock restore + coupon) | ✅ PASS |
| ExpireUnpaidOrdersUseCase (batch, per-order tx) | ✅ PASS |
| ProcessPaymentNotificationUseCase (HMAC, API, amount, idempotency, late payment) | ✅ PASS |
| VerifyPaymentUseCase (ownership, API, amount, tx) | ✅ PASS |
| WebhooksController (@Public, @Throttle, always 200, rawBody) | ✅ PASS |
| OrderNumberGenerator (table-based, ORD-YYYYMMDD-NNN) | ✅ PASS |
| Repository (atomic queries, parameterized) | ✅ PASS |
| Customer endpoints (6 routes, throttling) | ✅ PASS |
| Admin endpoints (4 routes, filters) | ✅ PASS |
| ORM entities (3 indexes, partials, relationships) | ✅ PASS |
| Module imports/exports | ✅ PASS |
| CLAUDE.md conventions | ✅ PASS |
| `tsc --noEmit` | ✅ PASS |

## Build Verification

- `npx tsc --noEmit` — passes with zero errors
