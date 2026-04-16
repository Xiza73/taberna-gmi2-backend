# Ecommerce GMI2 — Project Context

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (Express) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL + TypeORM |
| Auth | JWT + bcrypt (email/password) |
| Payments | MercadoPago (Checkout Pro) |
| Validation | class-validator + class-transformer |
| Testing | Jest + supertest + @nestjs/testing |
| Security | helmet + @nestjs/throttler |

## Architecture

4-layer Clean Architecture per module:
- **Domain**: Pure entities, value objects, interfaces, enums (zero framework deps)
- **Application**: Use cases (one per operation), DTOs, application services
- **Infrastructure**: ORM entities, repositories, mappers, external service adapters
- **Presentation**: Controllers, guards, strategies

### Layer Rules

```
presentation  → application (use cases, DTOs)
application   → domain (entities, interfaces, enums)
infrastructure → domain (implements interfaces, maps entities)
domain        → shared/domain ONLY (BaseEntity, value objects, exceptions)
```

### Module Structure

```
{module}/
  {module}.module.ts
  domain/entities/, enums/, interfaces/, services/
  application/use-cases/, dtos/, services/
  infrastructure/orm-entities/, repositories/, mappers/, services/
  presentation/{resource}.controller.ts
```

### Module Variants

- **Full DDD**: All 4 layers
- **Orchestration**: application + presentation only
- **Infrastructure**: No controller, @Global
- **Scheduler**: tasks only (e.g., `scheduled-tasks`)

### Key Decisions

1. **Domain entities separate from ORM entities** — connected by static Mapper classes
2. **Symbol-based DI tokens** — co-located with repository interfaces in domain layer
3. **One use case per operation** — `@Injectable` class with single `execute()` method
4. **BaseResponse envelope** — `{ success, data?, message? }` on all JSON responses
5. **Global guard chain** — Throttler → JwtAuth → Roles via APP_GUARD

## Naming Conventions

- Files: `kebab-case.{type}.ts` (e.g., `product.entity.ts`, `create-order.use-case.ts`)
- Classes: `PascalCase` (e.g., `Product`, `CreateOrderUseCase`)
- Interfaces: `I` prefix (`IProductRepository`)
- DI tokens: `UPPER_SNAKE` Symbol (`PRODUCT_REPOSITORY`)
- Enums: PascalCase name, `UPPER_SNAKE = 'lower_snake'` members
- Private fields: `_camelCase` with public `camelCase` getters
- DB columns: `snake_case` via TypeORM `name:` option
- DB tables: `snake_case` plural

## File Organization

- One class per file (except related DTOs co-located)
- Barrel exports only in `shared/domain/exceptions/` and `shared/domain/value-objects/`
- Path aliases: `@shared/*`, `@modules/*`, `@test/*`
- Test specs co-located with source: `*.spec.ts`

## Coding Style

- Single quotes, trailing commas `all`, LF endings
- Named exports exclusively (no default exports)
- Constructor injection, `@Inject(SYMBOL)` for interfaces, all params `private readonly`
- async/await only, no Observables in app/domain layers
- Minimal comments, no JSDoc
- Import order: @nestjs → third-party → @shared/@modules → relative
- Domain exceptions extending Error, not HttpException
- `private readonly logger = new Logger(ClassName.name)` in infrastructure only

## Code Patterns

### Domain Entity
```typescript
export class {Entity} extends BaseEntity {
  private _{field}: {Type};
  private constructor(...) { super(...); }
  static create(props: {...}): {Entity} { /* validate + return */ }
  static reconstitute(props: {...}): {Entity} { /* no validation */ }
  get {field}(): {Type} { return this._{field}; }
}
```

### Repository Interface + Token
```typescript
export const {ENTITY}_REPOSITORY = Symbol('{ENTITY}_REPOSITORY');
export interface I{Entity}Repository extends IBaseRepository<{Entity}> {
  findBy{Criteria}(...): Promise<{Entity} | null>;
}
```

### Use Case
```typescript
@Injectable()
export class {Action}UseCase {
  constructor(@Inject(TOKEN) private readonly repo: IRepo) {}
  async execute(userId: string, dto: Dto): Promise<ResponseDto> { }
}
```

### DTOs
```typescript
// Input (validators, no constructor)
export class Create{Entity}Dto {
  @IsString() @IsNotEmpty() name: string;
}
// Output (constructor, no validators)
export class {Entity}ResponseDto {
  constructor(entity: {Entity}) { this.id = entity.id; }
}
```

### Exception Hierarchy
```
DomainException → 400
  DomainUnauthorizedException → 401
  DomainNotFoundException → 404
  DomainForbiddenException → 403
  DomainConflictException → 409
```

## Do / Don't

- DO return `BaseResponse.ok(result)` from every controller method
- DO throw `DomainException` subclasses from domain/application layers
- DO use `ErrorMessages` constants for error strings
- DO use `reconstitute()` in mappers (skip validation for DB data)
- DON'T import `@nestjs/*` in domain layer
- DON'T return domain entities from use cases (map to DTOs)
- DON'T use `HttpException` in domain/application layers
- DON'T use `@PrimaryGeneratedColumn` (use `@PrimaryColumn('uuid')`)

## Module Registration

- Repositories: `{ provide: SYMBOL, useClass: Impl }`
- Domain services: `{ provide: SYMBOL, useValue: new Service() }`
- Use cases: direct class reference
- Exports: tokens only (never use cases)

## Skills

Use `/ecommerce-api-generator [module-name]` to generate new modules following these patterns.

## Implementation Workflow

Before implementing any phase or module, ALWAYS read these files first:

1. **`docs/CHANGELOG-DESIGN.md`** — 14 validated rules (R1-R14). NEVER revert these decisions.
2. **`docs/IMPLEMENTATION-PLAN.md`** — Read ONLY the section for the current phase.
3. **`docs/modules/{module}.md`** — Read ONLY the module(s) being implemented in that phase.
4. **`docs/CONTEXT-GLOBAL.md`** — Read ONLY when working on DB constraints, env vars, or cross-module flows.

DO NOT read all docs at once. Read only what the current phase requires.
