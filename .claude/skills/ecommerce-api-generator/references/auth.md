# Authentication & Authorization

## Architecture (framework-agnostic)

- JWT-based authentication with email/password registration
- Global auth guard with opt-out via decorator
- Composite refresh token format for O(1) lookup + secure verification
- Refresh token rotation on every refresh
- Role-based access control (RBAC) with 2 roles: admin, customer
- Password hashing with bcrypt (cost 12)

---

## Email/Password Authentication

### Registration Flow

```
POST /auth/register          → RegisterUseCase.execute()
                             → hash password (bcrypt)
                             → create User entity
                             → generate access + refresh tokens
                             → return BaseResponse<AuthTokensResponseDto>
```

### Login Flow

```
POST /auth/login             → LoginUseCase.execute()
                             → find user by email
                             → verify password (bcrypt compare)
                             → generate access + refresh tokens
                             → return BaseResponse<AuthTokensResponseDto>
```

### NestJS Implementation

```typescript
// Register Use Case
@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthTokensResponseDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) throw new DomainConflictException(ErrorMessages.EMAIL_ALREADY_EXISTS);

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = User.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.CUSTOMER,
    });

    const saved = await this.userRepository.save(user);
    return this.generateTokens(saved);
  }
}
```

### Admin Seeding

First admin created via migration or seed script, not auto-provisioned on first registration.

---

## JWT Token System

### Payload

```typescript
interface JwtPayload {
  sub: string;     // user ID (UUID)
  email: string;
  role: string;    // 'admin' | 'customer'
  iat: number;
  exp: number;
}
```

### Configuration

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | **required** | HMAC signing secret |
| `JWT_EXPIRATION` | `300` (5 min) | Access token TTL (seconds) |
| `JWT_REFRESH_EXPIRATION` | `604800` (7 days) | Refresh token TTL (seconds) |

---

## Refresh Token Rotation

### Architecture (framework-agnostic)

Composite token format: `{tokenId}.{rawToken}`
- `tokenId` → O(1) DB lookup (indexed)
- `rawToken` → verified against bcrypt hash (cost 12)

### Flow

1. Parse composite token into `{tokenId, rawToken}`
2. Look up stored token by ID
3. Validate: not expired, not revoked
4. Verify raw token against bcrypt hash
5. Revoke old token immediately
6. Generate new access + refresh token pair (full rotation)

---

## Auth Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `POST /auth/register` | @Public | No | Create account |
| `POST /auth/login` | @Public | No | Login with email/password |
| `POST /auth/refresh` | @Public | No | Rotate refresh token |
| `POST /auth/logout` | JWT | Yes | Revoke current session |
| `GET /auth/me` | JWT | Yes | Get current user profile |

---

## RBAC

```typescript
export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}
```

Usage: `@Roles('admin')` on controller or handler. `RolesGuard` checks `request.user.role`.

- **admin**: Full access to backoffice (CRUD products, categories, orders, users)
- **customer**: Browse products, manage cart, place orders, manage own profile/addresses

---

## Global Guard Pipeline

```typescript
// Execution order matches registration order
{ provide: APP_GUARD, useClass: ThrottlerGuard },    // 1st: Rate limiting (before auth to block brute-force)
{ provide: APP_GUARD, useExisting: JwtAuthGuard },   // 2nd: Authentication
{ provide: APP_GUARD, useClass: RolesGuard },        // 3rd: Authorization
```

- `JwtAuthGuard` loads user from DB on every request
- `@Public()` opts out of auth (register, login, product listing, etc.)
- `@Roles('admin')` restricts access to backoffice endpoints
- `@SkipThrottle()` opts out of rate limiting
