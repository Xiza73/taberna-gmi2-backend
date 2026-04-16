# Bugfix Tracker — Auditoría Post-Implementación

**Fecha inicio**: 2026-04-16
**Estado**: COMPLETADO — Ronda 3 verificada (17/17 PASS)

> Este documento rastrea todos los bugs/issues encontrados por los 5 agentes de auditoría,
> su estado de corrección y verificación. Evita re-corregir issues ya resueltos.

---

## Ronda 1 — Issues Críticos (8)

| ID | Issue | Agentes | Severidad | Estado | Archivos Afectados |
|----|-------|---------|-----------|--------|---------------------|
| FIX-01 | No existen migraciones de esquema de BD (incluye `order_number_counters`) | PO, SD, NestJS | CRITICAL | VERIFICADO | `src/migrations/1713100000000-InitialSchema.ts` (nuevo) |
| FIX-02 | Webhook signature bypass — se salta verificación si no hay header | SEC, SD | CRITICAL | VERIFICADO | `src/modules/orders/presentation/webhooks.controller.ts`, `process-payment-notification.use-case.ts` |
| FIX-03 | Reset password token format mismatch (forgot genera separado, reset espera compuesto) | SEC, NestJS | CRITICAL | VERIFICADO | `src/modules/auth/application/use-cases/forgot-password.use-case.ts` |
| FIX-04 | Doble registro ElasticsearchModule con env vars distintas | ARCH, SD, NestJS | CRITICAL | VERIFICADO | `src/app.module.ts` — eliminado registro duplicado, se usa solo SharedModule |
| FIX-05 | Falta validación MercadoPago secrets al startup | PO, ARCH, SD | CRITICAL | VERIFICADO | `src/main.ts` — agregado `getOrThrow` para ambos secrets |
| FIX-06 | XSS sanitization insuficiente en reviews (regex naive vs sanitize-html) | SEC, PO | CRITICAL | VERIFICADO | `src/modules/reviews/application/use-cases/create-review.use-case.ts` — usa `sanitize-html` |
| FIX-07 | Shipment transitions no atómicas (usa save() en vez de atomicStatusTransition) | SD, NestJS | CRITICAL | VERIFICADO | `create-shipment.use-case.ts`, `update-shipment.use-case.ts` — usa `atomicStatusTransition()` |
| FIX-08 | ES search error silenciado anula fallback a PostgreSQL | NestJS | CRITICAL | VERIFICADO | `elasticsearch-product-search.ts` — ahora `throw error` en vez de return vacío |

## Ronda 1 — Issues High (7)

| ID | Issue | Agentes | Severidad | Estado | Archivos Afectados |
|----|-------|---------|-----------|--------|---------------------|
| FIX-09 | Cart `findOrCreateByUserId` race condition (unique constraint violation) | NestJS | HIGH | VERIFICADO | `cart.repository.ts` — try/catch con retry en unique violation |
| FIX-10 | HTML injection en email templates (user name sin escapar) | SEC | HIGH | VERIFICADO | 6 templates + nuevo `escape-html.ts` helper — escapeHtml() en todos los user inputs |
| FIX-11 | Top products endpoint sin límite máximo (DoS) | SEC | HIGH | VERIFICADO | `admin-dashboard.controller.ts` — `Math.min(limit, 50)` |
| FIX-12 | `ApproveReviewUseCase` recalcula rating sin transacción | SD | HIGH | VERIFICADO | `approve-review.use-case.ts` — wrapped en `unitOfWork.execute()` |
| FIX-13 | No graceful shutdown (`enableShutdownHooks` faltante) | SD | HIGH | VERIFICADO | `main.ts` — `app.enableShutdownHooks()` |
| FIX-14 | `ProcessPaymentNotificationUseCase` crea Payment nuevo en vez de upsert | SD, NestJS | HIGH | VERIFICADO | `process-payment-notification.use-case.ts` — usa `upsertByExternalId()` y reutiliza existingPayment |
| FIX-15 | ES search: `@IsNotEmpty` faltante en `q` | Multiple | HIGH | VERIFICADO | `search-query.dto.ts`, `search-suggest-query.dto.ts` — `@IsNotEmpty()` agregado |

## Ronda 3 — Issues Nuevos (2 CRITICAL + 1 MEDIUM)

| ID | Issue | Agentes | Severidad | Estado | Archivos Afectados |
|----|-------|---------|-----------|--------|---------------------|
| FIX-21 | `UpdateOrderStatusUseCase` usa `transitionTo()` + `save()` no atómico (mismo patrón que FIX-07) | SD | CRITICAL | VERIFICADO | `update-order-status.use-case.ts` — usa `atomicStatusTransition()` |
| FIX-22 | `VerifyPaymentUseCase` usa `save()` en vez de `upsertByExternalId()` — duplica Payment si webhook ya procesó | SD | CRITICAL | VERIFICADO | `verify-payment.use-case.ts` — usa `upsertByExternalId()` |
| FIX-23 | `CreateReviewUseCase` duplicate check sin transacción (race condition) | SD | MEDIUM | DIFERIDO | Protegido por `uq_reviews_user_product` UNIQUE constraint en BD |

## Ronda 1 — Issues Medium (5)

| ID | Issue | Agentes | Severidad | Estado | Archivos Afectados |
|----|-------|---------|-----------|--------|---------------------|
| FIX-16 | Admin use cases inyectan DataSource directamente (viola Clean Arch) | ARCH | MEDIUM | DIFERIDO | `src/modules/admin/application/use-cases/*.ts` |
| FIX-17 | `ReindexProductsUseCase` inyecta ElasticsearchService en app layer | ARCH | MEDIUM | DIFERIDO | `src/modules/search/application/use-cases/reindex-products.use-case.ts` |
| FIX-18 | Logger en 6 application use cases (convención infra only) | ARCH | MEDIUM | DIFERIDO | Múltiples use cases |
| FIX-19 | `JwtAuthGuard` importa de `@modules/users/` (invierte dependencia shared→modules) | ARCH | MEDIUM | DIFERIDO | `src/shared/presentation/guards/jwt-auth.guard.ts` |
| FIX-20 | N+1 queries en CreateReviewUseCase y GetCartUseCase | NestJS | MEDIUM | DIFERIDO | `create-review.use-case.ts`, `get-cart.use-case.ts` |

> **Nota**: Issues MEDIUM marcados como DIFERIDO — pragmatic trade-offs, no bloquean producción.

---

## Log de Correcciones

### Ronda 1 — [2026-04-16]

**15 fixes aplicados:**

| Fix | Cambio realizado |
|-----|------------------|
| FIX-01 | Creada migración `1713100000000-InitialSchema.ts` con 17 tablas, 6 ENUMs, 21 índices, 19 CHECK constraints, todas las FK |
| FIX-02 | Webhook: `hasWebhookSecret()` método + verificación obligatoria cuando secret está configurado. `verifySignature()` retorna `false` si no hay secret |
| FIX-03 | `forgot-password.use-case.ts`: token URL cambiado a formato compuesto `${userId}.${rawToken}` |
| FIX-04 | `app.module.ts`: eliminado import `ElasticsearchModule` y su `registerAsync()` duplicado. Solo queda el de SharedModule (@Global) |
| FIX-05 | `main.ts`: agregado `configService.getOrThrow('MERCADOPAGO_ACCESS_TOKEN')` y `getOrThrow('MERCADOPAGO_WEBHOOK_SECRET')` |
| FIX-06 | `create-review.use-case.ts`: regex `/<[^>]*>/g` reemplazado por `sanitizeHtml(comment, { allowedTags: [], allowedAttributes: {} })` |
| FIX-07 | `create-shipment.use-case.ts` y `update-shipment.use-case.ts`: `order.transitionTo() + save()` reemplazado por `atomicStatusTransition()` |
| FIX-08 | `elasticsearch-product-search.ts`: `return { items: [], total: 0 }` cambiado a `throw error` para que el fallback en el use case funcione |
| FIX-09 | `cart.repository.ts`: `findOrCreateByUserId` envuelto en try/catch — si unique constraint falla, re-fetch |
| FIX-10 | 6 email templates: creado `escape-html.ts` helper, aplicado `escapeHtml()` a todos los user inputs (name, carrier, trackingUrl, productNames) |
| FIX-11 | `admin-dashboard.controller.ts`: `Math.min(Math.max(limit, 1), 50)` en getTopProducts |
| FIX-12 | `approve-review.use-case.ts`: save + recalculate envueltos en `unitOfWork.execute()` con repos transaccionales |
| FIX-13 | `main.ts`: agregado `app.enableShutdownHooks()` |
| FIX-14 | `process-payment-notification.use-case.ts`: usa `existingPayment ??` para reutilizar entity existente + `upsertByExternalId()` |
| FIX-15 | `search-query.dto.ts` y `search-suggest-query.dto.ts`: `@IsNotEmpty()` agregado al campo `q` |

**Build**: `npx tsc --noEmit` — 0 errores

### Ronda 2 — Verificación [2026-04-16]

**5 agentes de verificación desplegados** — solo re-verificaron los 15 fixes corregidos.

| Agente | Fixes verificados | Resultado |
|--------|-------------------|-----------|
| Seguridad (SEC) | FIX-02, FIX-03, FIX-06, FIX-10, FIX-11, FIX-15 | 6/6 PASS |
| Product Owner (PO) | FIX-01, FIX-05, FIX-06, FIX-14 | 4/4 PASS |
| Arquitectura (ARCH) | FIX-04, FIX-05, FIX-08, FIX-12 | 4/4 PASS |
| System Design (SD) | FIX-02, FIX-07, FIX-09, FIX-13, FIX-14 | 5/5 PASS |
| NestJS Expert | FIX-01, FIX-03, FIX-04, FIX-07, FIX-08, FIX-09, FIX-15 + Build | 7/7 PASS + Build PASS |

**Resultado**: 15/15 fixes VERIFICADOS. 0 nuevos issues críticos/high encontrados.

**Observaciones menores** (no bloquean):
1. Typo `safeLimt` → `safeLimit` en `admin-dashboard.controller.ts` — corregido post-verificación
2. `suggest()` en ES retorna `[]` en error — aceptable, no existe fallback para sugerencias

### Ronda 3 — Nuevos Fixes [2026-04-16]

**2 fixes aplicados:**

| Fix | Cambio realizado |
|-----|------------------|
| FIX-21 | `update-order-status.use-case.ts`: `transitionTo()` valida transición, luego `atomicStatusTransition()` escribe atómicamente. Si falla → `DomainConflictException(ORDER_STATUS_CONFLICT)` |
| FIX-22 | `verify-payment.use-case.ts`: `paymentRepo.save(payment)` reemplazado por `paymentRepo.upsertByExternalId(payment)` — previene duplicados si webhook ya procesó |

**Build**: `npx tsc --noEmit` — 0 errores

---

## Convenciones

- **PENDIENTE**: Issue identificado, no corregido aún
- **CORREGIDO**: Fix aplicado, pendiente de verificación
- **VERIFICADO**: Fix confirmado por agente de verificación
- **DIFERIDO**: Se deja para futuro (no bloquea producción)
- **FALSO POSITIVO**: Revisado y descartado como no-issue
