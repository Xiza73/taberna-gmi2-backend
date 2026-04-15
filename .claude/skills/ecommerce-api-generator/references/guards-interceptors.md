# Guards, Interceptors, Exception Filters & Middleware

## Request Pipeline

### Architecture (framework-agnostic)

```
Request → Middleware → Guards → Pipes → Handler → Exception Filter → Response
```

### NestJS Implementation

```
Middleware: helmet, CORS
Guards:    ThrottlerGuard → JwtAuthGuard → RolesGuard
Pipes:     ValidationPipe (global)
Handler:   Controller method
Filter:    GlobalExceptionFilter (catches ALL)
```

---

## Guards

### JwtAuthGuard (Authentication)

Manual `CanActivate` implementation (NOT Passport's `AuthGuard('jwt')`):

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check @Public() — skip if present
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (isPublic) return true;

    // 2. Extract Bearer token
    // 3. Verify JWT
    // 4. Load user from DB (live check every request)
    // 5. Attach AuthenticatedUser to request
    return true;
  }
}
```

Registered via `APP_GUARD` with `useExisting` (reuses DI-managed instance from AuthModule).

### RolesGuard (Authorization)

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (!requiredRoles) return true;  // No @Roles = open to any authenticated user
    return requiredRoles.includes(request.user.role);
  }
}
```

---

## Custom Decorators

```typescript
// @Public() — opt out of JwtAuthGuard
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// @Roles(...roles) — require specific roles
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// @CurrentUser() — extract authenticated user from request
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user;
    return data ? user?.[data] : user;
  },
);
```

### AuthenticatedUser Shape

```typescript
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;    // 'admin' | 'customer'
}
```

---

## Rate Limiting

- Global: 1500 requests / 60 seconds
- Per-endpoint override: `@Throttle({ default: { limit: 5, ttl: 60000 } })`
- Webhook override: `@Throttle({ default: { limit: 100, ttl: 60000 } })` (not @SkipThrottle — still rate-limit to prevent abuse)

---

## Middleware

```typescript
app.use(helmet());                    // Security headers
app.enableCors({ origin: FRONTEND_URL, credentials: true });
app.setGlobalPrefix('api/v1');
```

---

## Interceptors

No interceptors are registered. The `src/shared/presentation/interceptors/` directory exists but is empty. `BaseResponse.ok()` in controllers serves the role of a response transformation interceptor.
