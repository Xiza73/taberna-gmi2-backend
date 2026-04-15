# Modules + Controllers Reference

## Module Patterns

### Architecture (framework-agnostic)

- One module per bounded context / domain feature
- Modules encapsulate domain, application, infrastructure, and presentation layers
- Cross-module communication via exported repository tokens and services only
- Circular dependencies handled via lazy resolution

### NestJS Implementation

#### Pattern 1: Full-Feature Module

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([{Entity}OrmEntity]),
    forwardRef(() => {CircularDep}Module),
    {DirectDep}Module,
  ],
  controllers: [{Entity}Controller],
  providers: [
    // Repositories (interface-bound via token)
    { provide: {ENTITY}_REPOSITORY, useClass: {Entity}Repository },

    // Domain Services (stateless, no @Injectable)
    { provide: {SERVICE_TOKEN}, useValue: new {ServiceClass}() },

    // Application Services
    {ApplicationService},

    // Use Cases (direct class registration)
    {Action}{Entity}UseCase,

    // Processors (BullMQ workers)
    {Queue}Processor,
  ],
  exports: [{ENTITY}_REPOSITORY, {SERVICE_TOKEN}],
})
export class {ModuleName}Module {}
```

#### Pattern 2: Orchestration-Only Module (no ORM entities)

```typescript
@Module({
  imports: [{Dep}Module, {Dep2}Module],
  controllers: [{Name}Controller],
  providers: [{Action}UseCase],
})
export class {Name}Module {}
```

Examples: `AdminModule`, `CheckoutModule`

#### Pattern 3: Infrastructure-Only Module (no controller)

```typescript
@Global()
@Module({
  providers: [{ provide: {TOKEN}, useClass: {Implementation} }],
  exports: [{TOKEN}],
})
export class {Name}Module {}
```

Examples: `NotificationsModule`

> **Note**: `SearchModule` is a Full DDD module (not infrastructure-only) — it has domain interfaces, infrastructure services, application use cases, and controllers. ProductsModule imports it directly for `PRODUCT_SEARCH_SYNC`.

> **Note**: Prefer interface-token separation over `forwardRef` to break circular dependencies. Define the interface + token in the module that needs it, and implement it in the providing module.

#### Pattern 4: Queue-Heavy Module

```typescript
@Module({
  imports: [
    BullModule.registerQueue(
      { name: '{queue-name}' },
      { name: '{queue-name-2}' },
    ),
  ],
  providers: [{Queue}Processor],
})
```

---

## Controller Patterns

### Architecture (framework-agnostic)

- One controller per resource
- Controllers handle only HTTP concerns (parse, validate, respond)
- Business logic delegated entirely to injected use cases
- All responses wrapped in uniform envelope
- Guards for authorization at class/method level

### NestJS Implementation

#### Standard Controller

```typescript
@Controller('{resources}')
export class {Resource}Controller {
  constructor(
    private readonly {action}UseCase: {Action}UseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query() query: {Query}Dto) {
    const result = await this.{list}UseCase.execute(user.id, query);
    return BaseResponse.ok(result);
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const result = await this.{get}UseCase.execute(id, user.id);
    return BaseResponse.ok(result);
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: Create{Entity}Dto) {
    const result = await this.{create}UseCase.execute(user.id, dto);
    return BaseResponse.ok(result);
  }

  @Patch(':id')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: Update{Entity}Dto) {
    const result = await this.{update}UseCase.execute(id, user.id, dto);
    return BaseResponse.ok(result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.{delete}UseCase.execute(id, user.id);
    return BaseResponse.ok(null, '{Entity} deleted');
  }

  // Non-CRUD action
  @Post(':id/{action}')
  @HttpCode(HttpStatus.OK)
  async {action}(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const result = await this.{action}UseCase.execute(id, user.id);
    return BaseResponse.ok(result);
  }
}
```

#### Admin/Role-Restricted Controller

```typescript
@Controller('admin')
@Roles('admin')
export class AdminController { ... }
```

#### Webhook Controller (MercadoPago IPN)

```typescript
@Controller('webhooks')
@Public()
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class WebhooksController {
  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }))
  async handlePaymentNotification(@Body() notification: MercadoPagoNotificationDto) {
    await this.processPaymentUseCase.execute(notification);
    return BaseResponse.ok(null);
  }
}
```

---

## Route Design Conventions

### HTTP Verb Mapping

| Operation | Verb | Route | HttpCode |
|---|---|---|---|
| Get single | GET | `:id` | 200 (implicit) |
| List | GET | `/` | 200 (implicit) |
| Create | POST | `/` | 201 (implicit) |
| Update | PATCH | `:id` | 200 (implicit) |
| Delete | DELETE | `:id` | `@HttpCode(200)` explicit |
| Action | POST | `:id/{verb}` | `@HttpCode(200)` explicit |

### Naming Rules

- Route prefixes: **plural nouns** (`products`, `categories`, `orders`, `users`, `cart`)
- Action sub-routes: **verb or noun** (`cancel`, `refund`, `ship`, `publish`, `checkout`)
- Nested sub-routes: `orders/:id/items`, `products/:id/reviews`, `categories/:id/products`
- Admin: prefixed under `/admin/{resource}`

---

## Response Handling

### BaseResponse Envelope

```typescript
export class BaseResponse<T> {
  success: boolean;
  data?: T;
  message?: string;

  static ok<T>(data?: T, message?: string): BaseResponse<T>;
  static fail<T = never>(message: string): BaseResponse<T>;
}
```

- `BaseResponse.ok(result)` — with data, no message
- `BaseResponse.ok(null, 'Deleted')` — void operations with confirmation message
