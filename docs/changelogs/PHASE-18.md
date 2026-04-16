# Phase 18 — Google OAuth

**Fecha**: 2026-04-16
**Scope**: Autenticación con Google Sign-In

---

## Archivos Creados (4)

| Archivo | Descripción |
|---------|-------------|
| `src/modules/auth/application/dtos/google-auth.dto.ts` | DTO de input con `idToken` |
| `src/modules/auth/application/use-cases/google-auth.use-case.ts` | Use case: verifica token Google, find/create/link usuario, retorna JWT |
| `src/migrations/1713300000000-AddGoogleIdToUsers.ts` | Migración: agrega `google_id` VARCHAR(255) UNIQUE a users |
| `src/scripts/seed.ts` | Script de seed completo para datos de ejemplo |

## Archivos Modificados (10)

| Archivo | Cambio |
|---------|--------|
| `src/modules/users/domain/entities/user.entity.ts` | `_googleId` field, getter, `linkGoogle()` method, `googleId` en `create()` y `reconstitute()` |
| `src/modules/users/infrastructure/orm-entities/user.orm-entity.ts` | Columna `google_id` VARCHAR(255) nullable unique |
| `src/modules/users/infrastructure/mappers/user.mapper.ts` | Mapea `googleId` en `toDomain()` y `toOrm()` |
| `src/modules/users/domain/interfaces/user-repository.interface.ts` | `findByGoogleId(googleId: string)` en interface |
| `src/modules/users/infrastructure/repositories/user.repository.ts` | Implementación de `findByGoogleId()` |
| `src/modules/auth/presentation/auth.controller.ts` | `POST /auth/google` endpoint con `@Public`, `@Throttle(5/min)` |
| `src/modules/auth/auth.module.ts` | Registra `GoogleAuthUseCase` como provider |
| `src/migrations/1713100000000-InitialSchema.ts` | `google_id` incluido en tabla users para instalaciones fresh |
| `.env` / `.env.example` | `GOOGLE_CLIENT_ID=your-google-client-id` |
| `package.json` | Scripts `db:seed` y `db:reset` |

## Dependencias Agregadas

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `google-auth-library` | ^10.6.2 | Verificación de Google ID tokens (`OAuth2Client.verifyIdToken`) |

## Flujo de Autenticación Google

```
Frontend (Google Sign-In SDK)
  │
  ▼ idToken
POST /auth/google { idToken: "eyJ..." }
  │
  ▼ OAuth2Client.verifyIdToken()
  │
  ├─ googleId existe en DB → login directo → JWT tokens
  ├─ email existe sin googleId → linkGoogle() → JWT tokens
  └─ usuario nuevo → User.create() + welcome email → JWT tokens
```

## Notas

- `GOOGLE_CLIENT_ID` es opcional: si no está configurado, el endpoint retorna `DomainException('Google OAuth is not configured')`
- Usuarios creados via Google reciben un password aleatorio hasheado (no pueden hacer login con password hasta hacer reset)
- El campo `google_id` es UNIQUE y nullable — permite que usuarios existentes vinculen su cuenta Google
- La verificación valida `email_verified === true` en el payload de Google
- Usuarios suspendidos (`isActive: false`) no pueden autenticarse via Google

## Build

- `npx tsc --noEmit` ✅ sin errores
