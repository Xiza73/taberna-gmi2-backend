# Phase 12: Shipping — Changelog

**Date**: 2026-04-15
**Status**: Completed

## Overview

Shipment tracking module with carrier URL auto-generation. Admin registers tracking, customer views shipment info. Shipment creation transitions order to shipped, delivery marks order as delivered.

---

## Shipping Module — Files Created (14)

### Domain Layer (5)
| File | Description |
|------|-------------|
| `carrier.enum.ts` | 5 values: shalom, serpost, olva, dhl, other |
| `shipment-status.enum.ts` | 3 values: shipped, in_transit, delivered |
| `shipment.entity.ts` | 8 fields + id. `create()`, `reconstitute()`, `update()` |
| `shipment-repository.interface.ts` | Extends IBaseRepository + findByOrderId |
| `tracking-url-generator.ts` | Domain service + TRACKING_URL_GENERATOR Symbol. 4 carrier URL templates, 'other' returns custom URL |

### Infrastructure Layer (3)
| File | Description |
|------|-------------|
| `shipment.orm-entity.ts` | Unique orderId index, enum columns (carrier, status) |
| `shipment.mapper.ts` | Static toDomain/toOrm |
| `shipment.repository.ts` | findByOrderId, withTransaction |

### Application Layer (6)
| File | Description |
|------|-------------|
| `create-shipment.dto.ts` | carrier (enum), trackingNumber, trackingUrl?, notes? |
| `update-shipment.dto.ts` | All optional, includes status enum |
| `shipment-response.dto.ts` | Constructor pattern, dates to ISO |
| `get-shipment.use-case.ts` | Ownership check via order.userId |
| `create-shipment.use-case.ts` | Validates paid/processing, checks unique, auto-generates trackingUrl, order→shipped + OrderEvent |
| `update-shipment.use-case.ts` | Regenerates trackingUrl on carrier/trackingNumber change, order→delivered on delivered status + OrderEvent |

### Presentation + Module (3)
| File | Description |
|------|-------------|
| `shipments.controller.ts` | GET /orders/:id/shipment (JWT, ownership) |
| `admin-shipments.controller.ts` | POST + PATCH /admin/orders/:id/shipment (@Roles admin) |
| `shipping.module.ts` | Imports OrdersModule, TrackingUrlGenerator as useValue, exports SHIPMENT_REPOSITORY |

---

## Files Modified (1)

| File | Change |
|------|--------|
| `src/app.module.ts` | Added ShippingModule import |

## Validation Results

| Check | Result |
|-------|--------|
| Carrier enum (5 values) | ✅ PASS |
| ShipmentStatus enum (3 values) | ✅ PASS |
| Shipment entity (8 fields + id) | ✅ PASS |
| TrackingUrlGenerator (4 templates + other) | ✅ PASS |
| IShipmentRepository + findByOrderId | ✅ PASS |
| ORM entity (unique orderId, enums, snake_case) | ✅ PASS |
| DTOs (create, update, response) | ✅ PASS |
| GetShipmentUseCase (ownership) | ✅ PASS |
| CreateShipmentUseCase (validates + transitions) | ✅ PASS |
| UpdateShipmentUseCase (trackingUrl regen + delivered) | ✅ PASS |
| Endpoints (3 routes correct) | ✅ PASS |
| Module imports/exports | ✅ PASS |
| AppModule includes ShippingModule | ✅ PASS |
| CLAUDE.md conventions | ✅ PASS |

**0 bugs found.**

## Build Verification

- `npx tsc --noEmit` — passes with zero errors
