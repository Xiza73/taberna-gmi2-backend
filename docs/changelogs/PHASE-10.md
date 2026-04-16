# Phase 10: Payments — Changelog

**Date**: 2026-04-15
**Status**: Completed

## Overview

MercadoPago Checkout Pro integration module. Full DDD (NOT @Global). Exports `PAYMENT_PROVIDER` and `PAYMENT_REPOSITORY` tokens for use by OrdersModule in Phase 11. Webhook/verify-payment endpoints deferred to OrdersModule to avoid circular dependency.

---

## Payments Module — Files Created (12)

### Domain Layer (4)
| File | Description |
|------|-------------|
| `payment-status.enum.ts` | `PaymentStatus` enum: PENDING, APPROVED, REJECTED, REFUNDED |
| `payment.entity.ts` | Payment entity: 9 fields (orderId, externalId?, preferenceId?, method?, status, amount cents, paidAt?, rawResponse?). `create()`, `reconstitute()`, `updateFromProvider()` |
| `payment-repository.interface.ts` | `IPaymentRepository` extends IBaseRepository. Adds: findByOrderId, findByExternalId, upsertByExternalId |
| `payment-provider.interface.ts` | `IPaymentProvider` + `PAYMENT_PROVIDER` Symbol. Methods: createPreference, getPaymentInfo, getPreferencePayments. `PaymentInfo` type definition |

### Infrastructure Layer (4)
| File | Description |
|------|-------------|
| `payment.orm-entity.ts` | `@Entity('payments')`, order_id index, external_id unique partial index (WHERE NOT NULL), enum status, jsonb rawResponse |
| `payment.mapper.ts` | Static toDomain/toOrm for Payment |
| `payment.repository.ts` | All interface methods + upsertByExternalId (find-then-update/insert pattern), withTransaction |
| `mercado-pago-payment.service.ts` | MercadoPago adapter via fetch API. ConfigService for access token + URLs. Converts cents↔currency (÷100 out, ×100 in). Logger for errors |

### Application Layer (3)
| File | Description |
|------|-------------|
| `payment-response.dto.ts` | Constructor pattern output DTO, all fields mapped |
| `create-payment-preference.use-case.ts` | Creates preference via IPaymentProvider, saves Payment with PENDING status, returns {preferenceId, paymentUrl} |
| `get-payment-details.use-case.ts` | Finds by orderId, throws PAYMENT_NOT_FOUND, returns PaymentResponseDto |

### Presentation + Module (2)
| File | Description |
|------|-------------|
| `payments.controller.ts` | GET /admin/orders/:id/payment — @Roles('admin'), ParseUUIDPipe |
| `payments.module.ts` | NOT @Global, exports PAYMENT_PROVIDER + PAYMENT_REPOSITORY |

---

## Files Modified (1)

| File | Change |
|------|--------|
| `src/app.module.ts` | Added PaymentsModule import |

## Validation Results

| Check | Result |
|-------|--------|
| PaymentStatus enum (4 values) | ✅ PASS |
| Payment entity fields (9 + timestamps) | ✅ PASS |
| create() + reconstitute() + updateFromProvider() | ✅ PASS |
| IPaymentRepository (findByOrderId, findByExternalId, upsertByExternalId) | ✅ PASS |
| IPaymentProvider (3 methods + PaymentInfo type) | ✅ PASS |
| ORM entity (indexes, partial unique, jsonb, enum) | ✅ PASS |
| Mapper toDomain/toOrm | ✅ PASS |
| Repository all methods + withTransaction | ✅ PASS |
| MercadoPago service (fetch, ConfigService, Logger, cents conversion) | ✅ PASS |
| PaymentResponseDto constructor pattern | ✅ PASS |
| CreatePaymentPreferenceUseCase | ✅ PASS |
| GetPaymentDetailsUseCase | ✅ PASS |
| Controller: GET /admin/orders/:id/payment @Roles('admin') | ✅ PASS |
| Module NOT @Global, exports tokens | ✅ PASS |
| AppModule includes PaymentsModule | ✅ PASS |
| CLAUDE.md conventions | ✅ PASS |

**0 bugs found.**

## Build Verification

- `npx tsc --noEmit` — passes with zero errors
