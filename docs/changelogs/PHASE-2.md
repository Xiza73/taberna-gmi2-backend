# Phase 2: Auth + Users — Changelog

**Fecha**: 2026-04-15
**Goal**: Autenticación JWT con refresh token rotation. Gestión de usuarios (customer + admin).

---

## Archivos creados

### Users Module (`src/modules/users/`)

| Capa | Archivos |
|------|----------|
| Domain | `domain/entities/user.entity.ts`, `domain/interfaces/user-repository.interface.ts` |
| Infrastructure | `infrastructure/orm-entities/user.orm-entity.ts`, `infrastructure/mappers/user.mapper.ts`, `infrastructure/repositories/user.repository.ts` |
| Application DTOs | `application/dtos/user-response.dto.ts`, `update-profile.dto.ts`, `change-password.dto.ts`, `user-query.dto.ts`, `update-user.dto.ts` |
| Application Use Cases | `get-profile.use-case.ts`, `update-profile.use-case.ts`, `change-password.use-case.ts`, `list-users.use-case.ts`, `get-user.use-case.ts`, `update-user.use-case.ts`, `suspend-user.use-case.ts`, `activate-user.use-case.ts` |
| Presentation | `presentation/users.controller.ts`, `presentation/admin-users.controller.ts` |
| Module | `users.module.ts` |

### Auth Module (`src/modules/auth/`)

| Capa | Archivos |
|------|----------|
| Domain | `domain/entities/refresh-token.entity.ts`, `domain/interfaces/refresh-token-repository.interface.ts` |
| Infrastructure | `infrastructure/orm-entities/refresh-token.orm-entity.ts`, `infrastructure/mappers/refresh-token.mapper.ts`, `infrastructure/repositories/refresh-token.repository.ts`, `infrastructure/cron/refresh-token-cleanup.cron.ts` |
| Application DTOs | `application/dtos/register.dto.ts`, `login.dto.ts`, `refresh-token.dto.ts`, `auth-tokens-response.dto.ts`, `forgot-password.dto.ts`, `reset-password.dto.ts` |
| Application Use Cases | `register.use-case.ts`, `login.use-case.ts`, `refresh-token.use-case.ts`, `logout.use-case.ts`, `get-me.use-case.ts`, `forgot-password.use-case.ts`, `reset-password.use-case.ts` |
| Presentation | `presentation/auth.controller.ts` |
| Module | `auth.module.ts` |

### Archivos actualizados

| Archivo | Cambio |
|---------|--------|
| `src/app.module.ts` | Importa `AuthModule` y `UsersModule` |
| `src/shared/presentation/guards/jwt-auth.guard.ts` | Inyecta `USER_REPOSITORY` (con `@Optional()`), carga user de DB, verifica `isActive` |

---

## Endpoints implementados

### Auth (7 endpoints)

| Method | Route | Auth | Throttle | Use Case |
|--------|-------|------|----------|----------|
| POST | `/auth/register` | @Public | 5/min | RegisterUseCase |
| POST | `/auth/login` | @Public | 5/min | LoginUseCase |
| POST | `/auth/refresh` | @Public | 10/min | RefreshTokenUseCase |
| POST | `/auth/logout` | JWT | global | LogoutUseCase |
| GET | `/auth/me` | JWT | global | GetMeUseCase |
| POST | `/auth/forgot-password` | @Public | 3/min | ForgotPasswordUseCase |
| POST | `/auth/reset-password` | @Public | 3/min | ResetPasswordUseCase |

### Users — Customer (3 endpoints)

| Method | Route | Auth | Use Case |
|--------|-------|------|----------|
| GET | `/users/profile` | JWT | GetProfileUseCase |
| PATCH | `/users/profile` | JWT | UpdateProfileUseCase |
| PATCH | `/users/change-password` | JWT | ChangePasswordUseCase |

### Users — Admin (5 endpoints)

| Method | Route | Auth | Use Case |
|--------|-------|------|----------|
| GET | `/admin/users` | @Roles('admin') | ListUsersUseCase |
| GET | `/admin/users/:id` | @Roles('admin') | GetUserUseCase |
| PATCH | `/admin/users/:id` | @Roles('admin') | UpdateUserUseCase |
| POST | `/admin/users/:id/suspend` | @Roles('admin') | SuspendUserUseCase |
| POST | `/admin/users/:id/activate` | @Roles('admin') | ActivateUserUseCase |

---

## Seguridad implementada

| Feature | Implementación |
|---------|----------------|
| Composite refresh token | Formato `{tokenId}.{rawToken}` — O(1) lookup por ID + verificación bcrypt |
| Token rotation | Nuevo token hereda `familyId` del anterior |
| Reuse detection | Si token ya revocado → revoca toda la familia (REFRESH_TOKEN_REUSED) |
| Password hashing | bcrypt cost 12 |
| Password requirements | `@MinLength(8)`, `@MaxLength(128)` en Register, Reset, ChangePassword |
| Change password → revoke sessions | `ChangePasswordUseCase` revoca todos los refresh tokens del usuario |
| Forgot password anti-enumeration | Siempre retorna éxito ("If the email exists...") |
| Reset password → revoke sessions | `ResetPasswordUseCase` revoca todos los tokens tras cambio |
| Suspend user → revoke sessions | `SuspendUserUseCase` revoca todos los tokens del usuario |
| JwtAuthGuard live check | Carga user de DB en cada request, verifica `isActive === true` |

---

## Decisiones técnicas

### D1: JwtAuthGuard usa @Optional() para USER_REPOSITORY

**Qué**: El guard usa `@Optional() @Inject(USER_REPOSITORY)` en vez de inyección obligatoria.
**Por qué**: El guard se registra en `AppModule` como `APP_GUARD`. Si `UsersModule` no está importado (o durante testing), el guard sigue funcionando con el payload del JWT. Con `@Optional`, es backwards-compatible y no rompe si el repositorio no está disponible.

### D2: forwardRef para dependencia circular Auth ↔ Users

**Qué**: `AuthModule` importa `forwardRef(() => UsersModule)` y viceversa.
**Por qué**: Auth necesita USER_REPOSITORY (para register, login, etc.). Users necesita REFRESH_TOKEN_REPOSITORY (para change-password, suspend que revocan tokens). NestJS requiere `forwardRef` para resolver la circularidad.

### D3: ForgotPassword usa token compuesto userId.rawToken

**Qué**: El token de reset es `{userId}.{rawToken}`, almacenando el hash en `User.resetPasswordToken`.
**Por qué**: Permite encontrar al usuario en O(1) sin necesitar un método `findByResetToken` que requeriría comparar bcrypt hashes de todos los usuarios. El userId no es secreto pero el rawToken sí.

### D4: Email de reset pendiente (TODO Phase 13)

**Qué**: `ForgotPasswordUseCase` genera el token pero no envía email — solo logea el token.
**Por qué**: El módulo de Notifications se implementa en Phase 13. Se dejó un `TODO` y un `logger.log` temporal para testing durante desarrollo.

---

## Validación

| Check | Estado |
|-------|--------|
| `pnpm run build` compila sin errores | PASS |
| 15 endpoints implementados (7 auth + 3 customer + 5 admin) | PASS |
| Domain entities: zero @nestjs imports | PASS |
| Composite refresh token format | PASS |
| Reuse detection con familyId | PASS |
| Password bcrypt cost 12 | PASS |
| @Throttle en auth endpoints | PASS |
| @Roles('admin') en admin endpoints | PASS |
| BaseResponse.ok() en todos los controllers | PASS |
| UsersModule exports USER_REPOSITORY | PASS |
| AuthModule exports REFRESH_TOKEN_REPOSITORY | PASS |
| forwardRef circular dependency | PASS |
| JwtAuthGuard carga user de DB | PASS |
| RefreshTokenCleanupCron semanal | PASS |
