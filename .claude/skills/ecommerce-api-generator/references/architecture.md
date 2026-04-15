# Architecture Reference

## Overview

**Architecture**: Clean Architecture / DDD with four layers per module.
**Framework**: NestJS v11 on Express, TypeORM, PostgreSQL, MercadoPago (payments).
**Key invariant**: Domain layer has zero framework imports. Application layer imports `@nestjs/common` only for `@Injectable` and `@Inject`. Infrastructure adapts frameworks to domain interfaces. Presentation adapts HTTP to application use cases.

---

## Directory Structure Pattern

### Project Root

```
src/
  main.ts                          # Bootstrap
  app.module.ts                    # Root module, guard wiring
  config/
    typeorm.config.ts              # CLI-only DataSource for migrations
  migrations/
    *.ts                           # TypeORM migrations (raw SQL)
  shared/                          # Cross-cutting shared kernel
    shared.module.ts               # @Global() module
    domain/
      entities/base.entity.ts      # Abstract BaseEntity (id, timestamps)
      exceptions/                  # DomainException hierarchy + barrel index.ts
      interfaces/                  # IBaseRepository, IUnitOfWork
      value-objects/               # Money, Email, Address, Slug, etc.
      constants/error-messages.ts  # ErrorMessages const
      utils/                       # Pure utility functions
    application/
      dtos/                        # BaseResponse, PaginationDto
    infrastructure/
      typeorm-unit-of-work.ts      # UoW implementation
    presentation/
      decorators/                  # @Public, @Roles, @CurrentUser
      guards/                      # RolesGuard
      filters/                     # GlobalExceptionFilter
      interceptors/                # (empty)
      health.controller.ts
  modules/
    {module-name}/                 # One per bounded context
      {module-name}.module.ts
      domain/ → application/ → infrastructure/ → presentation/
```

### Per-Module Structure (Full Pattern)

```
{module-name}/
  {module-name}.module.ts
  domain/
    entities/{entity-name}/
      {entity-name}.entity.ts          # Rich domain model
      {entity-name}.entity.spec.ts     # Unit tests co-located
    enums/{enum-name}.enum.ts
    interfaces/{entity-name}-repository.interface.ts   # Symbol + interface
    services/{service-name}.service.ts                 # Pure domain services (no DI decorators)
  application/
    dtos/
      create-{entity}.dto.ts           # Input DTOs (class-validator)
      update-{entity}.dto.ts
      {entity}-response.dto.ts         # Output DTOs (domain → API)
      {feature}-query.dto.ts
    use-cases/{action-group}/
      {action-name}.use-case.ts        # One class per use case
      {action-name}.use-case.spec.ts
    services/{service-name}.service.ts  # Cross-cutting application services
  infrastructure/
    orm-entities/{entity-name}.orm-entity.ts    # TypeORM @Entity
    repositories/{entity-name}.repository.ts    # implements I{Entity}Repository
    mappers/{entity-name}.mapper.ts             # Static toDomain()/toOrm()
    services/{service-name}.service.ts          # Adapter implementations (MercadoPago, email, etc.)
    processors/{job-name}.processor.ts          # BullMQ queue processors
  presentation/
    {resource}.controller.ts           # HTTP controllers
```

### Module Variants

| Module Type | Layers Present | Example |
|---|---|---|
| Full DDD module | domain + application + infrastructure + presentation | `products`, `orders`, `auth`, `users`, `categories` |
| Orchestration-only | application + presentation (no own domain/infra) | `admin` |
| Infrastructure-only | domain/interfaces + infrastructure | `notifications` (@Global) |
| Scheduler | tasks only | `scheduled-tasks` |

---

## Layer Separation Rules

### Architecture (framework-agnostic)

- Each layer depends only on layers closer to the domain center
- Domain has zero external dependencies
- Infrastructure implements domain interfaces
- Presentation delegates to application use cases

### NestJS Implementation

```
ALLOWED IMPORTS:
  presentation  → application (use cases, DTOs) + shared/presentation
  application   → domain + shared/domain + other modules' domain/interfaces via @Inject(SYMBOL)
  infrastructure → domain (implements interfaces, maps entities) + shared/infrastructure
  domain        → shared/domain ONLY (BaseEntity, value objects, exceptions)

FORBIDDEN:
  domain        -X→ application, infrastructure, presentation, NestJS, TypeORM
  application   -X→ infrastructure, presentation
  Any module    -X→ another module's infrastructure directly
```

| Layer | NestJS imports allowed |
|---|---|
| Domain | NONE |
| Application | `@Injectable`, `@Inject`, `@InjectQueue` |
| Infrastructure | `@Injectable`, `@InjectRepository`, `@Processor`, `@OnWorkerEvent` |
| Presentation | `@Controller`, HTTP decorators, param decorators |

---

## Module Dependency Graph

```
AppModule
  ├── ConfigModule.forRoot()           # Global config
  ├── ThrottlerModule.forRoot()        # Rate limiting
  ├── TypeOrmModule.forRootAsync()     # Database
  ├── SharedModule (@Global)           # → UNIT_OF_WORK
  ├── PaymentsModule                   # Full DDD, exports PAYMENT_PROVIDER + PAYMENT_REPOSITORY
  ├── AuthModule                       # → JwtAuthGuard, JwtModule, REFRESH_TOKEN_REPOSITORY
  ├── UsersModule                      # → AuthModule
  ├── CategoriesModule                 # standalone
  ├── ProductsModule                   # → CategoriesModule
  ├── CartModule                       # → ProductsModule
  ├── OrdersModule                     # → CartModule, ProductsModule, PaymentsModule
  ├── ReviewsModule                    # → ProductsModule, OrdersModule
  ├── AddressesModule                  # → UsersModule
  ├── AdminModule                      # → UsersModule, ProductsModule, OrdersModule, CategoriesModule
  └── SearchModule                     # → ProductsModule, CategoriesModule
```

`ProductsModule` is the central hub. Most modules depend on it directly.

---

## Bootstrap Configuration (main.ts)

### Architecture (framework-agnostic)

- Security headers middleware
- CORS with configurable origin
- Global API versioning prefix
- Input validation at API boundary
- Centralized exception-to-HTTP mapping
- API documentation endpoint

### NestJS Implementation

```typescript
// 1. Create app
const app = await NestFactory.create(AppModule, { rawBody: true }); // rawBody for webhook HMAC

// 2. Security
app.use(helmet());
app.enableCors({
  origin: configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
  credentials: true,
});

// 3. API prefix
app.setGlobalPrefix('api/v1');

// 4. Validation
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
}));

// 5. Exception filter — registered via APP_FILTER in AppModule (supports DI)
// Do NOT use app.useGlobalFilters(new ...) — it bypasses DI

// 6. Swagger
const config = new DocumentBuilder()
  .setTitle('{ProjectName} API')
  .addBearerAuth()
  .build();
SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

// 7. Listen
await app.listen(configService.get<number>('PORT', 3000));
```

---

## Global Guards (APP_GUARD)

```typescript
providers: [
  // GlobalExceptionFilter via DI
  { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  // Guard chain: Throttle → Auth → Roles
  JwtAuthGuard,  // register as provider so useExisting resolves
  { provide: APP_GUARD, useClass: ThrottlerGuard },    // 1st: Rate limiting (before auth to block brute-force)
  { provide: APP_GUARD, useExisting: JwtAuthGuard },   // 2nd: Authentication
  { provide: APP_GUARD, useClass: RolesGuard },         // 3rd: Authorization
],
```

- `useExisting` for JwtAuthGuard (needs DI from AuthModule)
- `useClass` for RolesGuard and ThrottlerGuard
- @Public() opts out of auth, @SkipThrottle() opts out of rate limiting

---

## BullMQ Queue Architecture

### Pattern (for any module needing async processing)

```typescript
// 1. Register queue in module
BullModule.registerQueue({ name: '{queue-name}' }),

// 2. Inject in use case (application layer)
@InjectQueue('{queue-name}') private readonly queue: Queue,

// 3. Add job from use case
await this.queue.add('{job-type}', { entityId, userId });

// 4. Process in infrastructure layer
@Processor('{queue-name}')
export class {QueueName}Processor extends WorkerHost {
  async process(job: Job<{ entityId: string; userId: string }>): Promise<void> { }
}
```

Queue naming: `kebab-case` nouns (e.g., `email-sending`, `order-processing`).
Processor location: `{module}/infrastructure/processors/{queue-name}.processor.ts`.

Note: `@InjectQueue()` in application-layer use cases is a pragmatic violation of strict Clean Architecture.

---

## Decision Log

| # | Decision | Why |
|---|---|---|
| D1 | Rich domain model with static factories | `create()` validates invariants; `reconstitute()` trusts DB data; prevents invalid state |
| D2 | Separate ORM entity from domain entity | Domain uses value objects (Money, Address) and business types; ORM uses TypeORM primitives; evolve independently |
| D3 | Symbol-based DI tokens | TypeScript interfaces erased at runtime; Symbols are unique, collision-free, co-located with interface |
| D4 | One use case per class | Command pattern; independently testable; clear single responsibility |
| D5 | Global modules: Shared, Uploads, Notifications | Cross-cutting concerns needed by most modules; avoids explicit import everywhere. PaymentsModule is NOT global — OrdersModule imports it explicitly |
| D6 | forwardRef for circular deps | Reflects genuine domain relationships; pragmatic NestJS solution |
| D7 | Fire-and-forget side effects | Email notifications/payment webhooks are secondary; primary op should respond fast |
| D8 | No synchronize in production | `synchronize: false` + `migrationsRun: true`; explicit, version-controlled migrations |
| D9 | Validation at API boundary | Global ValidationPipe catches malformed input; domain entities catch business rule violations |
| D10 | BaseResponse envelope | Consistent `{ success, data?, message? }` contract for frontend |
| D11 | UUID primary keys (app-generated) | Entity has ID immediately upon creation; no reload after insert; prevents enumeration attacks |
| D12 | Value objects for domain primitives | Prevents primitive obsession; Money enforces currency + amount, Address validates structure |
