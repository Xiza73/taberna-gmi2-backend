# Phase 13: Notifications — Changelog

**Date**: 2026-04-15
**Status**: Completed

## Overview

Infrastructure-only @Global module for transactional emails. IEmailSender interface with NodemailerEmailSender (SMTP). 6 HTML email templates. Fire-and-forget integration into 6 existing use cases.

---

## Notifications Module — Files Created (9)

### Domain Layer (1)
| File | Description |
|------|-------------|
| `email-sender.interface.ts` | IEmailSender + EMAIL_SENDER Symbol. 6 methods with primitive-only params: sendWelcome, sendOrderConfirmation, sendPaymentConfirmed, sendOrderShipped, sendOrderDelivered, sendPasswordReset |

### Infrastructure Layer (7)
| File | Description |
|------|-------------|
| `nodemailer-email-sender.ts` | Implements IEmailSender. ConfigService for SMTP_HOST/PORT/USER/PASS/EMAIL_FROM. Logger. Private `send()` with try/catch |
| `welcome.template.ts` | Welcome email HTML template |
| `order-confirmation.template.ts` | Order confirmation with items table, prices in soles (cents÷100) |
| `payment-confirmed.template.ts` | Payment confirmed email with order number and total |
| `order-shipped.template.ts` | Order shipped email with carrier and tracking URL link |
| `order-delivered.template.ts` | Order delivered email with product list + review invitation |
| `password-reset.template.ts` | Password reset email with reset URL button (1h expiry) |

### Module (1)
| File | Description |
|------|-------------|
| `notifications.module.ts` | @Global, provides EMAIL_SENDER as useClass, exports EMAIL_SENDER |

---

## Files Modified (6)

| File | Change |
|------|--------|
| `src/app.module.ts` | Added NotificationsModule import |
| `src/modules/auth/application/use-cases/register.use-case.ts` | Added fire-and-forget sendWelcome on registration |
| `src/modules/auth/application/use-cases/forgot-password.use-case.ts` | Replaced TODO with sendPasswordReset (ConfigService for FRONTEND_URL) |
| `src/modules/orders/application/use-cases/create-order.use-case.ts` | Added fire-and-forget sendOrderConfirmation after checkout |
| `src/modules/orders/application/use-cases/process-payment-notification.use-case.ts` | Added fire-and-forget sendPaymentConfirmed on approved payment |
| `src/modules/shipping/application/use-cases/create-shipment.use-case.ts` | Added fire-and-forget sendOrderShipped on shipment creation |
| `src/modules/shipping/application/use-cases/update-shipment.use-case.ts` | Added fire-and-forget sendOrderDelivered on delivered status |

## Validation Results

| Check | Result |
|-------|--------|
| IEmailSender (6 methods, primitive params) | ✅ PASS |
| EMAIL_SENDER Symbol token | ✅ PASS |
| NodemailerEmailSender (SMTP config, Logger) | ✅ PASS |
| 6 HTML email templates | ✅ PASS |
| @Global module, exports EMAIL_SENDER | ✅ PASS |
| AppModule includes NotificationsModule | ✅ PASS |
| RegisterUseCase fire-and-forget sendWelcome | ✅ PASS |
| ForgotPasswordUseCase fire-and-forget sendPasswordReset | ✅ PASS |
| CreateOrderUseCase fire-and-forget sendOrderConfirmation | ✅ PASS |
| ProcessPaymentNotificationUseCase fire-and-forget sendPaymentConfirmed | ✅ PASS |
| CreateShipmentUseCase fire-and-forget sendOrderShipped | ✅ PASS |
| UpdateShipmentUseCase fire-and-forget sendOrderDelivered | ✅ PASS |
| No @nestjs imports in domain layer | ✅ PASS |
| CLAUDE.md conventions | ✅ PASS |

**0 bugs found.**

## Build Verification

- `npx tsc --noEmit` — passes with zero errors
