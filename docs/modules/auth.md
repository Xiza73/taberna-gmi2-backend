# 2. Auth

Autenticacion JWT con email/password. Refresh token rotation.

**Entity**: `RefreshToken`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| userId | uuid | FK → users |
| tokenHash | string | bcrypt hash del raw token |
| familyId | uuid | mismo para toda la cadena de rotacion — permite revocar familia completa si se detecta reuso |
| expiresAt | timestamptz | |
| isRevoked | boolean | default false |

**Endpoints:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | @Public, @Throttle(5/min) | Crear cuenta (customer) |
| POST | `/auth/login` | @Public, @Throttle(5/min) | Login email/password |
| POST | `/auth/refresh` | @Public, @Throttle(10/min) | Rotar refresh token |
| POST | `/auth/logout` | JWT | Revocar sesion |
| GET | `/auth/me` | JWT | Perfil del usuario actual |
| POST | `/auth/forgot-password` | @Public, @Throttle(3/min) | Enviar email con token de reset |
| POST | `/auth/reset-password` | @Public, @Throttle(3/min) | Resetear password con token |

**Use Cases**: `RegisterUseCase`, `LoginUseCase`, `RefreshTokenUseCase`, `LogoutUseCase`, `GetMeUseCase`, `ForgotPasswordUseCase`, `ResetPasswordUseCase`

**Reglas de seguridad:**
- **JwtStrategy.validate()**: cargar user de DB y verificar `isActive === true`. Si `false`, throw `DomainUnauthorizedException(USER_SUSPENDED)`. Cachear resultado 30s en memoria para evitar query por request.
- **Refresh token rotation con deteccion de reuso**: Al rotar, el nuevo token hereda el `familyId`. Si se detecta reuso de un token ya revocado, revocar TODA la familia (`UPDATE refresh_tokens SET is_revoked = true WHERE family_id = :familyId`), forzando re-login completo.
- **Password change invalida sesiones**: `ChangePasswordUseCase` revoca todos los refresh tokens del usuario despues de cambiar el hash.
- **Forgot password**: genera token con expiracion corta (1h). Se almacenan dos columnas en la entidad User: `resetPasswordToken: string?` (hash bcrypt del token) y `resetPasswordExpires: timestamptz?`. Envia email via `IEmailSender.sendPasswordReset(...)`. Al completar reset, se limpian ambos campos y se revocan todos los refresh tokens.
- **Password requirements**: `@MinLength(8)` y `@MaxLength(128)` en RegisterDto, ResetPasswordDto y ChangePasswordDto.
- **Refresh token cleanup**: cron job semanal en AuthModule (`RefreshTokenCleanupCron`) que purga tokens expirados/revocados: `DELETE FROM refresh_tokens WHERE is_revoked = true OR expires_at < NOW() - INTERVAL '7 days'`
