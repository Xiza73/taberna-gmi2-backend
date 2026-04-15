# Project Conventions

## Naming Table

| Element | Convention | Example |
|---|---|---|
| Files - controllers | `kebab-case.controller.ts` | `products.controller.ts` |
| Files - use cases | `kebab-case.use-case.ts` | `create-product.use-case.ts` |
| Files - domain entities | `kebab-case.entity.ts` | `product.entity.ts` |
| Files - ORM entities | `kebab-case.orm-entity.ts` | `product.orm-entity.ts` |
| Files - repositories | `kebab-case.repository.ts` | `product.repository.ts` |
| Files - interfaces | `kebab-case-repository.interface.ts` | `product-repository.interface.ts` |
| Files - mappers | `kebab-case.mapper.ts` | `product.mapper.ts` |
| Files - DTOs | `kebab-case.dto.ts` | `create-product.dto.ts` |
| Files - value objects | `kebab-case.vo.ts` | `money.vo.ts` |
| Files - enums | `kebab-case.enum.ts` | `order-status.enum.ts` |
| Files - services | `kebab-case.service.ts` | `mercado-pago.service.ts` |
| Files - filters | `kebab-case.filter.ts` | `http-exception.filter.ts` |
| Files - modules | `kebab-case.module.ts` | `products.module.ts` |
| Classes | `PascalCase` | `Product`, `CreateProductUseCase` |
| Interfaces | `I` + PascalCase | `IProductRepository` |
| DI tokens | `UPPER_SNAKE` Symbol | `PRODUCT_REPOSITORY` |
| Enum names | PascalCase | `OrderStatus` |
| Enum members | `UPPER_SNAKE = 'lower_snake'` | `IN_PROGRESS = 'in_progress'` |
| Methods | camelCase | `execute()`, `findBySlug()` |
| Private fields | `_camelCase` | `_name`, `_price` |
| Public getters | camelCase | `get name()` |
| DB columns | snake_case | `user_id`, `created_at` |
| DB tables | snake_case plural | `products`, `order_items` |

## Module Registration Order

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([...]),  // ORM Entities
    forwardRef(() => ...),             // Circular deps
    OtherModule,                       // Direct deps
  ],
  controllers: [...],
  providers: [
    // Section comments for organization:
    // Repositories
    { provide: TOKEN, useClass: Impl },
    // Domain Services
    { provide: TOKEN, useValue: new Service() },
    // Application Services
    ApplicationService,
    // Processors
    QueueProcessor,
    // Use Cases
    ActionUseCase,
  ],
  exports: [TOKEN],  // Export tokens only, never use cases
})
```

## Generation Order

```
nest-cli.json + tsconfig → config module → database module + ORM entities + migrations →
domain entities + value objects + enums → domain interfaces + DI tokens →
infrastructure mappers + repositories → DTOs (create, update, query, response) →
domain services → application services → use cases →
guards + decorators + filters → controllers →
module declarations → app.module.ts → main.ts bootstrap
```

## Do / Don't

| DO | DON'T |
|---|---|
| Export repository tokens from modules | Export use cases or controllers |
| Use `@Inject(SYMBOL)` for interfaces | Use string tokens for DI |
| Return `BaseResponse.ok(result)` | Return raw data from controllers |
| Throw `DomainException` subclasses | Throw `HttpException` from domain/application |
| Use `reconstitute()` in mappers | Use `new Entity()` directly |
| Keep domain layer free of NestJS | Import `@nestjs/*` in domain |
| Map domain → DTO in use case | Return domain entities from use cases |
| Use `ErrorMessages` constants | Use inline error strings |
