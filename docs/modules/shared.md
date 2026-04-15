# 1. Shared (@Global)

Infraestructura base reutilizable por todos los modulos.

**Contenido:**
- `BaseEntity` (id UUID, createdAt, updatedAt)
- Value Objects: `Money`, `Email`, `Slug`, `PhoneNumber`, `AddressSnapshot` (para snapshots en ordenes, evita colision con entity Address)
- Exception hierarchy: `DomainException` (400), `DomainUnauthorizedException` (401), `DomainNotFoundException` (404), `DomainForbiddenException` (403), `DomainConflictException` (409)
- `ErrorMessages` constants
- `IBaseRepository<T>` interface
- `IUnitOfWork` interface — para transacciones DB multi-repositorio:
  ```typescript
  type TransactionContext = unknown; // opaco en domain layer — infra layer castea a EntityManager
  execute<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T>
  ```
  Los repositories exponen un metodo `withTransaction(ctx: TransactionContext)` que retorna una instancia del repo que opera dentro de la transaccion. `TransactionContext` es opaco en domain/application layers — la implementacion `TypeOrmUnitOfWork` pasa `queryRunner.manager` y los repos lo castean internamente a `EntityManager`. Esto mantiene el domain layer libre de imports de TypeORM.
- `BaseResponse<T>` envelope (`ok`, `fail`)
- `PaginationDto`, `PaginatedResponseDto` (MAX_PAGE_SIZE = 50)
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@Public()`, `@Roles()`, `@CurrentUser()`
- Filters: `GlobalExceptionFilter` — usa `@Catch()` sin argumentos para atrapar tanto `DomainException` subclasses como `HttpException` de NestJS. Mapea: `DomainUnauthorizedException` → 401, `DomainNotFoundException` → 404, `DomainForbiddenException` → 403, `DomainConflictException` → 409, `DomainException` → 400, `HttpException` → su status code, unknown → 500. Todas las respuestas usan `BaseResponse.fail()`. Validation errors de `ValidationPipe` se formatean como array de mensajes dentro de `BaseResponse.fail()`.
- `AuthenticatedUser` interface
