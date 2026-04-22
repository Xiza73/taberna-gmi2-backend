# 2. Auth

Autenticacion JWT con email/password para dos sujetos separados: **Customer** (ecommerce) y **Staff** (backoffice). Refresh token rotation con deteccion de reuso.

**Type:** Full DDD

---

## SubjectType

El sistema distingue dos tipos de sujeto autenticado via `SubjectType` enum:
- `CUSTOMER` = 'customer' — clientes del ecommerce
- `STAFF` = 'staff' — personal del backoffice

El `subjectType` se incluye en el JWT payload y determina contra que repositorio se valida el usuario.

---

## Entity: RefreshToken

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| userId | uuid | ID del customer o staff member |
| subjectType | SubjectType | `customer` / `staff` |
| tokenHash | string | bcrypt hash del raw token |
| familyId | uuid | para deteccion de reuso — revoca familia completa si se reutiliza un token |
| expiresAt | timestamptz | |
| isRevoked | boolean | default false |

---

## Endpoints — Customer Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | @Public, @Throttle(5/min) | Crear cuenta customer |
| POST | `/auth/login` | @Public, @Throttle(5/min) | Login customer (email/password) |
| POST | `/auth/google` | @Public, @Throttle(5/min) | Login/registro customer con Google OAuth |
| POST | `/auth/refresh` | @Public, @Throttle(10/min) | Rotar refresh token (customer) |
| POST | `/auth/logout` | JWT+Customer | Revocar sesion customer |
| GET | `/auth/me` | JWT+Customer | Perfil del customer actual |
| POST | `/auth/forgot-password` | @Public, @Throttle(3/min) | Email con token de reset |
| POST | `/auth/reset-password` | @Public, @Throttle(3/min) | Resetear password con token |

## Endpoints — Staff Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/staff/auth/login` | @Public, @Throttle(5/min) | Login staff (email/password) |
| POST | `/staff/auth/google` | @Public, @Throttle(5/min) | Login staff con Google OAuth |
| POST | `/staff/auth/refresh` | @Public, @Throttle(10/min) | Rotar refresh token (staff) |
| POST | `/staff/auth/logout` | JWT+Staff | Revocar sesion staff |
| GET | `/staff/auth/me` | JWT+Staff | Perfil del staff actual |
| POST | `/staff/auth/forgot-password` | @Public, @Throttle(3/min) | Email con token de reset |
| POST | `/staff/auth/reset-password` | @Public, @Throttle(3/min) | Resetear password con token |

**Nota**: Staff NO tiene endpoint de register publico. El registro de staff es via invitacion (ver [staff.md](staff.md)).

---

## JWT Payload

```typescript
{
  sub: string;         // userId (customer o staff)
  email: string;
  name: string;
  role: string;        // 'customer' | StaffRole ('super_admin' | 'admin' | 'user')
  subjectType: SubjectType;  // 'customer' | 'staff'
}
```

---

## Use Cases

### Customer Auth
- **RegisterUseCase** — Crear customer + hash password + generar tokens (subjectType: CUSTOMER)
- **CustomerLoginUseCase** — Verificar credenciales + generar tokens
- **CustomerGoogleAuthUseCase** — Verificar idToken con Google, auto-crear o vincular cuenta
- **CustomerRefreshTokenUseCase** — Rotar refresh token (valida subjectType: CUSTOMER)
- **CustomerLogoutUseCase** — Revocar refresh token
- **CustomerGetMeUseCase** — Retornar perfil del customer autenticado
- **CustomerForgotPasswordUseCase** — Generar token de reset + enviar email
- **CustomerResetPasswordUseCase** — Resetear password + revocar todos los refresh tokens

### Staff Auth
- **StaffLoginUseCase** — Verificar credenciales + generar tokens (subjectType: STAFF, role: staff.role)
- **StaffGoogleAuthUseCase** — Verificar idToken con Google, vincular cuenta staff existente
- **StaffRefreshTokenUseCase** — Rotar refresh token (valida subjectType: STAFF)
- **StaffLogoutUseCase** — Revocar refresh token
- **StaffGetMeUseCase** — Retornar perfil del staff autenticado (incluye role)
- **StaffForgotPasswordUseCase** — Generar token de reset + enviar email
- **StaffResetPasswordUseCase** — Resetear password + revocar todos los refresh tokens

### Shared
- **RefreshTokenCleanupCron** — Purga semanal de tokens expirados/revocados

---

## Reglas de seguridad

- **JwtAuthGuard.validate()**: Lee `subjectType` del JWT payload. Si `CUSTOMER` → busca en `ICustomerRepository`. Si `STAFF` → busca en `IStaffMemberRepository`. Verifica `isActive === true`. Cache 30s en memoria.
- **Refresh token rotation con deteccion de reuso**: Al rotar, el nuevo token hereda el `familyId`. Si se detecta reuso de token ya revocado → revocar TODA la familia, forzando re-login.
- **Password change invalida sesiones**: Revoca todos los refresh tokens del usuario.
- **Forgot password**: Token con expiracion 1h. Almacenado como bcrypt hash en `resetPasswordToken` + `resetPasswordExpires` en la entidad (Customer o StaffMember).
- **Password requirements**: `@MinLength(8)` `@MaxLength(128)` en todos los DTOs de password.
- **Refresh token cleanup**: cron semanal `@Cron('0 0 3 * * 0')` — `DELETE FROM refresh_tokens WHERE is_revoked = true OR expires_at < NOW() - INTERVAL '7 days'`
- **Staff Google OAuth**: Solo vincula cuentas existentes (no auto-crea staff — el registro es solo via invitacion). Si el email no corresponde a un staff existente → error.

---

## Google OAuth

- **Dependencia**: `google-auth-library` (`OAuth2Client.verifyIdToken()`)
- **Customer**: Frontend → Google Sign-In SDK → `idToken` → `POST /auth/google { idToken }` → backend verifica → si usuario nuevo, crea cuenta; si existente, login.
- **Staff**: `POST /staff/auth/google { idToken }` → backend verifica → busca staff por `googleId` o `email` → solo vincula si ya existe staff member → error si no existe.
- **DTO**: `GoogleAuthDto` con campo `idToken: string` (`@IsString @IsNotEmpty`)
- **Env var**: `GOOGLE_CLIENT_ID` (requerido para habilitar)
- **Seguridad**: Valida `email_verified === true`. Usuarios/staff suspendidos no pueden autenticarse via Google.

---

## Controllers

- `auth.controller.ts` — Endpoints de customer auth (`/auth/*`)
- `staff-auth.controller.ts` — Endpoints de staff auth (`/staff/auth/*`)

## Repository: IRefreshTokenRepository + REFRESH_TOKEN_REPOSITORY

- `findById(id)`: RefreshToken | null
- `save(entity)`: RefreshToken
- `revokeByFamily(familyId)`: void
- `revokeAllByUser(userId)`: void
- `deleteExpiredAndRevoked()`: number

## DI Notes

- AuthModule exporta `JwtModule` para que JwtAuthGuard resuelva `JwtService` a nivel AppModule.
- AuthModule importa CustomersModule y StaffModule para acceder a sus repositorios.
- JwtAuthGuard registrado en AppModule: `{ provide: APP_GUARD, useExisting: JwtAuthGuard }` (R12).
