---
name: ecommerce-api-generator
description: >
  Generates NestJS modules for this ecommerce API following Clean Architecture / DDD patterns:
  4-layer modules (domain/application/infrastructure/presentation), rich domain entities
  with static factories, separate ORM entities with mappers, Symbol-based DI,
  use-case-per-operation, TypeORM + PostgreSQL, JWT auth, class-validator DTOs,
  BaseResponse envelope, and testing with mock factories.
  Triggers: "generate module", "create feature", "add endpoint", "scaffold module",
  "new module", "build feature".
argument-hint: "[module or feature name]"
disable-model-invocation: true
---

# Ecommerce API Generator

Generates NestJS modules and features for the **ecommerce-gmi2** project following Clean Architecture / DDD patterns.

**Target module/feature:** $ARGUMENTS

## Workflow

```
1. REFINE ──→ 2. PLAN ──→ 3. GENERATE ──→ 4. VALIDATE ──→ 5. FEEDBACK
   feature       arch        code in          check            user
   + scope        + deps      order            consistency      review
```

---

## Step 1: Refine the Feature (ASK the user)

Before writing any code, clarify:

- **What does this module do?** (CRUD, custom actions, orchestration)
- **Entities involved** (main entities + relationships with existing modules)
- **API endpoints** (list each endpoint: method, path, auth required?)
- **Auth/Roles** (which roles can access which endpoints?)
- **Dependencies** (does it depend on other modules? which ones?)
- **Async processing** (queues needed? scheduled tasks?)

Present a summary table and **confirm before proceeding**.

---

## Step 2: Plan Architecture

1. Classify the module:
   - **Full DDD**: domain + application + infrastructure + presentation
   - **Orchestration-only**: application + presentation (composes other modules)
   - **Infrastructure-only**: provides global service (e.g., storage, notifications)
2. Define entity relationships with existing modules
3. Identify if `forwardRef` is needed (circular deps)
4. List BullMQ queues if async processing needed

Output a **dependency diagram** before generating.

Read [architecture.md](references/architecture.md) for the exact patterns.

---

## Step 3: Generate in Order

### For shared/base infrastructure (first time only):

> **Before generating:** Check if `src/shared/` already exists. If it does, SKIP this section entirely — only generate shared infrastructure for greenfield projects.

```
1.  .env.example + src/config/typeorm.config.ts
2.  src/shared/domain/entities/base.entity.ts
3.  src/shared/domain/value-objects/ (as needed)
4.  src/shared/domain/exceptions/ (hierarchy + barrel)
5.  src/shared/domain/interfaces/ (IBaseRepository, IUnitOfWork)
6.  src/shared/domain/constants/error-messages.ts
7.  src/shared/infrastructure/typeorm-unit-of-work.ts
8.  src/shared/application/dtos/ (BaseResponse, PaginationDto)
9.  src/shared/presentation/ (decorators, guards, filters)
10. src/shared/shared.module.ts (@Global)
```

### For each module (in dependency order):

```
a. domain/enums/
b. domain/entities/ (rich domain model with static factories)
c. domain/interfaces/ (repository interface + Symbol token)
d. domain/services/ (if needed, pure logic)
e. infrastructure/orm-entities/ (TypeORM decorators)
f. infrastructure/mappers/ (static toDomain/toOrm)
g. infrastructure/repositories/ (implements interface)
h. infrastructure/services/ (external adapters)
i. application/dtos/ (create, update, query, response)
j. application/services/ (if cross-cutting)
k. application/use-cases/ (one per operation)
l. presentation/controller.ts
m. {module}.module.ts
```

### Finally:

```
- Update src/app.module.ts (register new module)
- Generate migration if new entities added:
    pnpm run migration:generate -- -n {MigrationName}
```

### Per-file reference guides:

| What to generate | Read reference |
|---|---|
| Module structure, controller pattern | [modules-controllers.md](references/modules-controllers.md) |
| Use cases, services, DI | [providers-di.md](references/providers-di.md) |
| Domain entities, ORM entities, mappers | [database.md](references/database.md) |
| Migrations workflow, CLI, conventions | [migrations.md](references/migrations.md) |
| DTOs, validation | [validation.md](references/validation.md) |
| Auth, guards, decorators | [auth.md](references/auth.md), [guards-interceptors.md](references/guards-interceptors.md) |
| Error handling | [error-handling.md](references/error-handling.md) |
| Tests | [testing.md](references/testing.md) |
| Naming, file organization | [conventions.md](references/conventions.md) |
| Coding style | [coding-style.md](references/coding-style.md) |

---

## Step 4: Validate

After generating, check:

```
Generate code → Check module imports/exports match →
Check DI tokens are registered → Check naming matches conventions →
Check patterns match references → Fix issues → Repeat
```

### Validation checklist:

- [ ] Every `@Inject(TOKEN)` has a matching `{ provide: TOKEN, useClass: ... }` in a module
- [ ] Every module's `exports` only contain tokens, not use cases
- [ ] All domain entities have `create()` and `reconstitute()` static factories
- [ ] All domain entities have private `_fields` with public getters
- [ ] ORM entities use `@PrimaryColumn('uuid')` not `@PrimaryGeneratedColumn`
- [ ] Mappers convert value objects ↔ primitives (integer cents used directly, no BigInt conversion)
- [ ] All controller methods return `BaseResponse.ok(result)`
- [ ] All DELETE endpoints have `@HttpCode(HttpStatus.OK)`
- [ ] Input DTOs have validators, Response DTOs have constructors (never mixed)
- [ ] `ErrorMessages` constants used for throw messages
- [ ] Domain layer has zero `@nestjs/*` imports
- [ ] Application layer imports only `@Injectable`, `@Inject`
- [ ] Global guards registered: ThrottlerGuard → JwtAuthGuard (useExisting) → RolesGuard
- [ ] GlobalExceptionFilter registered via APP_FILTER (not `new` in main.ts)
- [ ] `TransactionContext` (opaque) used in domain/app layers, never `EntityManager` directly
- [ ] `@MaxLength()` on all string/text DTO fields
- [ ] New module is imported in `app.module.ts`
- [ ] `pnpm run build` compiles without errors
- [ ] `pnpm run test` passes (existing tests don't break)

---

## Step 5: Feedback Loop

Present the generated module to the user:
1. Show the file tree of what was created
2. Show the dependency graph with existing modules
3. Ask for feedback on:
   - Missing endpoints
   - Entity relationship changes
   - Auth/permission adjustments
   - Any pattern deviations needed

Apply feedback and re-validate.

---

## Key Principles

**Examples > prose.** Code snippets with `{placeholders}` teach better than descriptions.

**Only include what Claude can't infer.** Don't explain NestJS decorators. DO show the specific domain entity + ORM entity + mapper + repository pattern.

**Exact scripts for fragile operations.** Module declarations, DI setup, guard configuration need precision. High freedom for business logic internals.

**Generation order matters.** Config → shared → domain → infrastructure → application → presentation → module → app.module. Breaking this order causes broken imports.

---

## DO NOT Generate

- Swagger decorators (`@ApiProperty`, `@ApiOperation`, `@ApiResponse`)
- Default exports (use named exports exclusively)
- JSDoc comments
- Barrel exports (except in `shared/domain/exceptions/` and `shared/domain/value-objects/`)
- `PartialType(CreateDto)` for Update DTOs (write from scratch)
- `@PrimaryGeneratedColumn` (use `@PrimaryColumn('uuid')`)
- `HttpException` in domain/application layers (use `DomainException` subclasses)
