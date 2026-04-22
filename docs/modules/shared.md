# 1. Shared (@Global)

Infraestructura base reutilizable por todos los modulos.

---

## Contenido

### Domain Layer

**BaseEntity** (id UUID, createdAt, updatedAt)

**Value Objects**: `Money`, `Email`, `Slug`, `PhoneNumber`, `AddressSnapshot` (para snapshots en ordenes, evita colision con entity Address)

**Exception Hierarchy**:
- `DomainException` → 400
- `DomainUnauthorizedException` → 401
- `DomainNotFoundException` → 404
- `DomainForbiddenException` → 403
- `DomainConflictException` → 409

**ErrorMessages** — constantes centralizadas de error

**IBaseRepository\<T\>** — interface base con `withTransaction(ctx): this`

**IUnitOfWork** — transacciones DB multi-repositorio:
```typescript
type TransactionContext = unknown; // opaco en domain layer — infra castea a EntityManager
execute<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T>
```
Los repositorios exponen `withTransaction(ctx: TransactionContext)` que retorna una instancia del repo que opera dentro de la transaccion. `TypeOrmUnitOfWork` pasa `queryRunner.manager` como `TransactionContext`. Esto mantiene el domain layer libre de imports de TypeORM.

**Enums**:
- `SubjectType` — `CUSTOMER = 'customer'`, `STAFF = 'staff'` (compartido entre Auth, Guards, JWT)
- `StaffRole` — `SUPER_ADMIN = 'super_admin'`, `ADMIN = 'admin'`, `USER = 'user'` (compartido entre Staff, Guards, POS)

### Application Layer

**DTOs**:
- `BaseResponse<T>` — envelope (`ok`, `fail`)
- `PaginationDto`, `PaginatedResponseDto` (MAX_PAGE_SIZE = 50)

### Presentation Layer

**Guards**:
- `JwtAuthGuard` — Extrae Bearer token, verifica JWT, carga user de DB segun `subjectType` del payload (CUSTOMER → ICustomerRepository, STAFF → IStaffMemberRepository). Verifica `isActive`. Cache 30s.
- `SubjectTypeGuard` — Lee metadata de `@RequireSubjectType()`. Valida `request.user.subjectType` contra los tipos requeridos. Si no hay decorator, permite paso.
- `StaffRoleGuard` — Lee metadata de `@RequireStaffRole()`. Solo aplica si `subjectType === STAFF`. Valida `request.user.role` contra los roles requeridos. Si no hay decorator, permite paso.

**Guard chain en AppModule** (orden de APP_GUARD):
```
ThrottlerGuard → JwtAuthGuard → SubjectTypeGuard → StaffRoleGuard
```

**Decorators**:
- `@Public()` — Marca endpoint como publico (JwtAuthGuard lo skipea)
- `@RequireSubjectType(SubjectType.STAFF)` — Requiere tipo de sujeto especifico
- `@RequireStaffRole(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)` — Requiere rol de staff especifico
- `@CurrentUser()` — Extrae user del request

**Interfaces**:
- `AuthenticatedUser` — Shape del user en el request: `{ id, email, name, role, subjectType }`

**Filters**:
- `GlobalExceptionFilter` — `@Catch()` sin argumentos. Mapea:
  - `DomainUnauthorizedException` → 401
  - `DomainNotFoundException` → 404
  - `DomainForbiddenException` → 403
  - `DomainConflictException` → 409
  - `DomainException` → 400
  - `HttpException` → su status code
  - unknown → 500
  - Todas usan `BaseResponse.fail()`. Validation errors se formatean como array de mensajes.

**Middleware**:
- `LoggingMiddleware` — Request logging → Elasticsearch con method, path, status, duration, userId, ip. Index: `ecommerce-logs-YYYY.MM.DD`.

---

## AppModule Registration

```typescript
providers: [
  // Global Exception Filter via DI
  { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  // Guard chain: Throttle → Auth → SubjectType → StaffRole
  JwtAuthGuard,
  SubjectTypeGuard,
  StaffRoleGuard,
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  { provide: APP_GUARD, useExisting: JwtAuthGuard },
  { provide: APP_GUARD, useExisting: SubjectTypeGuard },
  { provide: APP_GUARD, useExisting: StaffRoleGuard },
],
```

**Nota**: SubjectTypeGuard y StaffRoleGuard usan `useExisting` (igual que JwtAuthGuard, R12) para que la DI resuelva sus dependencias correctamente.
