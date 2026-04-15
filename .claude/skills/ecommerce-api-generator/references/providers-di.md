# Providers & Dependency Injection

## Use-Case Pattern

### Architecture (framework-agnostic)

- One class = one operation = one `execute()` method
- Constructor receives dependencies; `execute()` receives runtime parameters
- Returns application-layer DTOs, never domain entities
- No HTTP/framework awareness inside use cases
- Private helper methods allowed within the same class

### NestJS Implementation

```typescript
@Injectable()
export class {Action}{Entity}UseCase {
  constructor(
    @Inject({ENTITY}_REPOSITORY)
    private readonly {entity}Repository: I{Entity}Repository,
    private readonly {service}: {Service},
  ) {}

  async execute(userId: string, dto: {Action}Dto): Promise<{Response}Dto> {
    // 1. Load and validate
    // 2. Call domain entity behavior methods
    // 3. Persist via repository
    // 4. Side effects (activity logging, media processing)
    // 5. Return response DTO
    return new {Response}Dto(savedEntity);
  }
}
```

Registration: direct class reference in module `providers` array (no token):
```typescript
providers: [CreateProductUseCase, GetProductUseCase, UpdateProductUseCase]
```

---

## Service Classification (Three Tiers)

### 1. Domain Services (pure logic, no @Injectable)

Located in `{module}/domain/services/`. Plain classes with zero NestJS dependencies.

```typescript
export const {SERVICE_NAME} = Symbol('{SERVICE_NAME}');

export class {ServiceName} {
  {method}(input: {Type}): {ReturnType} { /* pure domain logic */ }
}
```

Registration: `{ provide: {SERVICE_NAME}, useValue: new {ServiceName}() }`

Used for: `PriceCalculator`, `StockValidator` (pure domain logic)

### 2. Application Services (@Injectable, orchestration)

Located in `{module}/application/services/`. Cross-cutting helpers consumed by multiple use cases.

```typescript
@Injectable()
export class {Service} {
  constructor(
    @Inject({REPO}_REPOSITORY) private readonly repo: I{Repo}Repository,
  ) {}
  // Multiple public methods
}
```

Registration: direct class reference. Examples: `CartService`, `OrderStatusService`, `EmailNotificationService`

### 3. Infrastructure Services (@Injectable, external adapters)

Located in `{module}/infrastructure/services/`. Wrap third-party SDKs.

```typescript
@Injectable()
export class {Service} implements I{Interface}, OnModuleInit {
  async onModuleInit(): Promise<void> { /* initialize */ }
  // Implements domain interface methods
}
```

Registration:
- With interface: `{ provide: {TOKEN}, useClass: {Service} }` (e.g., MercadoPagoPaymentService)
- Without interface: direct class reference (e.g., EmailService)

---

## Repository Pattern

### Architecture (framework-agnostic)

- Interface + Symbol token in domain layer
- Implementation in infrastructure layer
- All methods return domain entities, never ORM entities
- Mapper handles conversion at persistence boundary

### NestJS Implementation

**Interface** (`domain/interfaces/{entity}-repository.interface.ts`):
```typescript
export const {ENTITY}_REPOSITORY = Symbol('{ENTITY}_REPOSITORY');

export interface I{Entity}Repository extends IBaseRepository<{Entity}> {
  findBy{Criteria}(...): Promise<{Entity} | null>;
  findAll{Criteria}(...): Promise<{ items: {Entity}[]; total: number }>;
  hardDelete(id: string): Promise<void>;
}
```

**TransactionContext** (defined in `shared/domain/interfaces/unit-of-work.interface.ts`, re-exported for use in base-repository):
```typescript
export type TransactionContext = unknown; // opaque — infra casts to EntityManager
```

**Base interface** (`shared/domain/interfaces/base-repository.interface.ts`):
```typescript
import { TransactionContext } from './unit-of-work.interface';

export interface IBaseRepository<T> {
  save(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  withTransaction(ctx: TransactionContext): IBaseRepository<T>;
}
```

**Module registration**:
```typescript
{ provide: {ENTITY}_REPOSITORY, useClass: {Entity}Repository }
```

---

## Unit of Work Pattern

### Architecture (framework-agnostic)

```typescript
export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');

export interface IUnitOfWork {
  execute<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T>;
}
```

### NestJS Implementation

```typescript
@Injectable()
export class TypeOrmUnitOfWork implements IUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  async execute<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const result = await work(queryRunner.manager as TransactionContext);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

Registered globally via `SharedModule` (`@Global`).

---

## DI Token Discovery

To find existing DI tokens in the codebase, search for Symbol declarations in domain interface files:

```bash
grep -r "Symbol('" src/modules/*/domain/interfaces/ src/shared/domain/interfaces/
```

Token naming convention: `{ENTITY}_REPOSITORY` for repositories, `{SERVICE_NAME}` for domain/infrastructure services.
Location: co-located with the interface in `domain/interfaces/{entity}-repository.interface.ts`.

When adding a new module, check existing tokens to avoid collisions and to discover which repositories from other modules are available for injection.

---

## Registration Strategies

| Strategy | When Used |
|----------|-----------|
| `{ provide: SYMBOL, useClass: Impl }` | Repositories, infrastructure services backing interfaces |
| `{ provide: SYMBOL, useValue: new Class() }` | Domain services (pure logic, no DI needed) |
| `ClassReference` (shorthand) | Use-cases, application services, processors |
| `{ provide: APP_GUARD, useExisting: Guard }` | Global guards referencing DI-managed instance |
| `{ provide: APP_GUARD, useClass: Guard }` | Global guards created by framework |
| `useFactory` | Async config modules (TypeORM, BullMQ, JWT) |
