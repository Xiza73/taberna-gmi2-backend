# Phase 17: Final Polish — Changelog

**Date**: 2026-04-15
**Status**: Completed

## Overview

Final phase: health check endpoint via @nestjs/terminus, idempotent admin seed migration, startup validations (JWT_SECRET strength, DB_PASSWORD required), and improved ValidationPipe error formatting.

---

## Files Created (3)

| File | Description |
|------|-------------|
| `src/health/health.controller.ts` | @Controller('health') @Public(). HealthCheckService + TypeOrmHealthIndicator. @HealthCheck() on GET /health |
| `src/health/health.module.ts` | Imports TerminusModule, declares HealthController |
| `src/migrations/1713200000000-SeedAdminUser.ts` | Seeds admin@tienda.com, Admin123! (bcrypt cost 12), role 'admin'. Idempotent via ON CONFLICT (email) DO NOTHING. Reversible down() |

## Files Modified (2)

| File | Change |
|------|--------|
| `src/main.ts` | JWT_SECRET validation (≥32 chars, no CHANGE-ME), DB_PASSWORD required via getOrThrow(), ValidationPipe exceptionFactory flattens constraint messages into BadRequestException |
| `src/app.module.ts` | Added HealthModule + ScheduleModule imports. Final module list: 18+ modules |

## Validation Results

| Check | Result |
|-------|--------|
| Health endpoint (@Public, GET /health) | ✅ PASS |
| HealthModule (TerminusModule import) | ✅ PASS |
| TypeOrmHealthIndicator database ping | ✅ PASS |
| Seed migration (admin user, bcrypt, idempotent) | ✅ PASS |
| Seed migration reversible (down deletes by email) | ✅ PASS |
| JWT_SECRET validation (≥32 chars) | ✅ PASS |
| DB_PASSWORD required via getOrThrow() | ✅ PASS |
| ValidationPipe error formatting | ✅ PASS |
| AppModule final imports (all modules present) | ✅ PASS |
| CLAUDE.md conventions | ✅ PASS |

**0 bugs found.**

## Build Verification

- `npx tsc --noEmit` — passes with zero errors
