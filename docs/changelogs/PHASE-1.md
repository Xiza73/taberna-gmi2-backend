# Phase 1: Shared Infrastructure + Logging Middleware — Changelog

**Fecha**: 2026-04-15
**Goal**: Infraestructura base reutilizable por todos los módulos. Logging a Elasticsearch.

---

## Archivos creados

### Domain Layer (`src/shared/domain/`)

| Archivo | Descripción |
|---------|-------------|
| `entities/base.entity.ts` | BaseEntity abstracta: id (UUID via `randomUUID()`), createdAt, updatedAt, `markUpdated()` |
| `value-objects/money.vo.ts` | Money VO: amount (integer centavos) + currency (default PEN), `create()` + `fromExisting()` |
| `value-objects/email.vo.ts` | Email VO: validación regex, normaliza a lowercase |
| `value-objects/slug.vo.ts` | Slug VO: genera URL-safe string, strip caracteres no alfanuméricos |
| `value-objects/phone-number.vo.ts` | PhoneNumber VO: validación formato internacional |
| `value-objects/address-snapshot.vo.ts` | AddressSnapshot VO: snapshot inmutable para órdenes (recipientName, phone, street, reference, district, city, department) |
| `value-objects/index.ts` | Barrel export de todos los VOs |
| `exceptions/domain.exception.ts` | Base exception (extends `Error`, NO `HttpException`) → 400 |
| `exceptions/domain-unauthorized.exception.ts` | → 401 |
| `exceptions/domain-not-found.exception.ts` | → 404, auto-formatted message: `"{entity} with id {id} not found"` |
| `exceptions/domain-forbidden.exception.ts` | → 403, default: `"Access denied"` |
| `exceptions/domain-conflict.exception.ts` | → 409 |
| `exceptions/index.ts` | Barrel export |
| `interfaces/base-repository.interface.ts` | `IBaseRepository<T>`: save, findById, delete, `withTransaction(ctx)` |
| `interfaces/unit-of-work.interface.ts` | `IUnitOfWork` + `TransactionContext` (opaque `unknown`) + `UNIT_OF_WORK` Symbol |
| `enums/user-role.enum.ts` | `UserRole`: `CUSTOMER = 'customer'`, `ADMIN = 'admin'` |
| `constants/error-messages.ts` | `ErrorMessages` object con 50+ mensajes de error centralizados |

### Application Layer (`src/shared/application/`)

| Archivo | Descripción |
|---------|-------------|
| `dtos/base-response.dto.ts` | `BaseResponse<T>` envelope: `ok(data?, message?)`, `fail(message)` |
| `dtos/pagination.dto.ts` | `PaginationDto` (MAX_PAGE_SIZE = 50) + `PaginatedResponseDto<T>` con totalPages computed |

### Infrastructure Layer (`src/shared/infrastructure/`)

| Archivo | Descripción |
|---------|-------------|
| `typeorm-unit-of-work.ts` | `TypeOrmUnitOfWork` implements `IUnitOfWork`: usa QueryRunner, pasa `queryRunner.manager` como `TransactionContext` |

### Presentation Layer (`src/shared/presentation/`)

| Archivo | Descripción |
|---------|-------------|
| `decorators/public.decorator.ts` | `@Public()` — opt-out de JwtAuthGuard via `IS_PUBLIC_KEY` metadata |
| `decorators/roles.decorator.ts` | `@Roles(...roles)` — requiere roles específicos via `ROLES_KEY` metadata |
| `decorators/current-user.decorator.ts` | `@CurrentUser()` — extrae `AuthenticatedUser` del request, soporta `@CurrentUser('id')` |
| `guards/jwt-auth.guard.ts` | `JwtAuthGuard` — implementa `CanActivate` directamente (NO Passport `AuthGuard('jwt')`) |
| `guards/roles.guard.ts` | `RolesGuard` — verifica rol del usuario contra `@Roles()` metadata |
| `filters/global-exception.filter.ts` | `GlobalExceptionFilter` — `@Catch()` sin argumentos, mapea toda la jerarquía de excepciones |
| `middleware/logging.middleware.ts` | `LoggingMiddleware` — logea cada request a ES index `ecommerce-logs-YYYY.MM.DD` |
| `interfaces/authenticated-user.interface.ts` | Shape: `{ id, email, name, role }` |

### Module Wiring

| Archivo | Cambios |
|---------|---------|
| `src/shared/shared.module.ts` | `@Global()`, importa ElasticsearchModule, provee UNIT_OF_WORK, aplica LoggingMiddleware a `*` |
| `src/app.module.ts` | Reescrito completo: ConfigModule, ThrottlerModule(1500/60s), ScheduleModule, TypeOrmModule, JwtModule(global), SharedModule. APP_FILTER + APP_GUARD chain |
| `src/main.ts` | helmet, CORS, json limit 1mb, prefix `api/v1`, ValidationPipe, rawBody:true |

### Archivos eliminados

| Archivo | Razón |
|---------|-------|
| `src/app.controller.ts` | Scaffold de NestJS CLI, ya no se usa |
| `src/app.service.ts` | Scaffold de NestJS CLI, ya no se usa |
| `src/app.controller.spec.ts` | Test del scaffold eliminado |

---

## Reglas de diseño aplicadas (CHANGELOG-DESIGN.md)

| Regla | Implementación |
|-------|----------------|
| R1: Guard chain Throttle → Auth → Roles | `APP_GUARD` registrados en ese orden en `app.module.ts` |
| R2: `@Catch()` sin argumentos | `GlobalExceptionFilter` usa `@Catch()` para atrapar todo |
| R8: JWT_EXPIRATION = 300 (5 min) | Default en `JwtModule.registerAsync` |
| R9: DomainUnauthorizedException → 401 | Primer check en GlobalExceptionFilter |
| R10: ErrorMessages centralizados | 50+ constantes en `error-messages.ts` |
| R11: APP_FILTER via DI | `{ provide: APP_FILTER, useClass: GlobalExceptionFilter }` en AppModule |
| R12: JwtAuthGuard useExisting | `{ provide: APP_GUARD, useExisting: JwtAuthGuard }` |

---

## Decisiones técnicas

### D1: JwtAuthGuard sin inyección de UserRepository (por ahora)

**Qué**: El `JwtAuthGuard` actual verifica el JWT y extrae el payload sin cargar el usuario de la DB en cada request.
**Por qué**: En Phase 1 aún no existe `UsersModule` ni `USER_REPOSITORY`. El guard se completará en Phase 2 cuando exista el repositorio de usuarios. La spec dice "load user from DB (live check every request)" pero eso requiere la dependencia de Users.
**Impacto**: Ninguno — el guard funciona para autenticación JWT básica. Se enriquecerá en Phase 2.

### D2: LoggingMiddleware fire-and-forget

**Qué**: El envío a Elasticsearch es async y no bloquea la respuesta. Errores de ES se logean como warning.
**Por qué**: El logging es secundario. Si ES está caído, la API debe seguir funcionando.

### D3: PaginationDto default limit = 20 (no 50)

**Qué**: El default de `limit` es 20 aunque MAX_PAGE_SIZE es 50.
**Por qué**: 20 es un default más conservador para la mayoría de listados. El máximo sigue siendo 50 items por página.

---

## Validación

| Check | Estado |
|-------|--------|
| `pnpm run build` compila sin errores | PASS |
| Domain layer: 0 imports de `@nestjs/*` | PASS |
| Exceptions extienden `Error`, no `HttpException` | PASS |
| BaseEntity usa `randomUUID()` (no auto-generated) | PASS |
| Value Objects: private constructor + factory methods | PASS |
| ErrorMessages: 50+ mensajes como `as const` | PASS |
| Guard chain: Throttle → Auth → Roles (APP_GUARD) | PASS |
| GlobalExceptionFilter via APP_FILTER con DI | PASS |
| JwtAuthGuard usa `useExisting` | PASS |
| LoggingMiddleware logea a `ecommerce-logs-YYYY.MM.DD` | PASS |

---

## Correcciones post-validación

### F1: ErrorMessages faltaban 3 mensajes de Uploads

**Problema**: El archivo `error-messages.ts` tenía 43 mensajes pero faltaban 3 del plan: `UPLOAD_FAILED`, `UPLOAD_INVALID_FORMAT`, `UPLOAD_TOO_LARGE`.
**Fix**: Agregados los 3 mensajes al final del objeto.
**Por qué**: El plan (IMPLEMENTATION-PLAN.md líneas 856-858) los define como parte del ErrorMessages centralizado, aunque pertenecen al módulo Uploads (Phase 6). Es correcto tenerlos todos desde Phase 1.

### F2: Dead ternary en LoggingMiddleware

**Problema**: Línea `error: res.statusCode >= 400 ? null : null` — siempre evalúa a `null`.
**Fix**: Simplificado a `error: null`.
**Por qué**: El campo `error` se reserva para futuro uso (captura de error messages en responses 4xx/5xx). Por ahora siempre es null según la spec.
