# Validation & DTOs

## Global ValidationPipe

### Architecture (framework-agnostic)

- All input validated at API boundary
- Unknown properties rejected
- Automatic type transformation for query parameters

### NestJS Implementation

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // Strip unknown properties
  transform: true,              // Auto-transform types
  forbidNonWhitelisted: true,   // Reject unknown properties (400)
}));
```

---

## DTO Categories (4 Types)

| Category | Suffix | Validators | Constructor | Purpose |
|---|---|---|---|---|
| Create/Command | `Create{Entity}Dto` | Yes | No | Request body for creation |
| Update/Mutation | `Update{Entity}Dto` | Yes | No | Request body for updates |
| Query | `{Feature}QueryDto` | Yes | No | Query string parameters |
| Response | `{Entity}ResponseDto` | No | Yes (from entity) | Outbound data |

**Key rule**: Input DTOs have validators but no constructor. Response DTOs have constructors but no validators. Never mixed.

---

## Create DTO Pattern

```typescript
export class Create{Entity}Dto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;                    // Required: no ?, no @IsOptional

  @IsUUID('4')
  @IsOptional()
  parentId?: string;               // Optional: ? + @IsOptional
}
```

Conventions: `@MaxLength(255)` for names, `@MaxLength(1000)` for descriptions, `@IsNumberString()` for BigInt values.

## Update DTO Pattern

```typescript
export class Update{Entity}Dto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;                   // All fields optional
}
```

Written from scratch (no `PartialType(CreateDto)`).

## Query DTO Pattern

```typescript
export class {Feature}QueryDto {
  @IsInt() @Min(1) @IsOptional() @Type(() => Number)
  page?: number = 1;

  @IsInt() @Min(1) @Max(100) @IsOptional() @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : value)
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
```

`@Type(() => Number)` for query string coercion. `@Transform()` for case normalization.

## Response DTO Pattern

```typescript
export class {Entity}ResponseDto {
  id: string;
  name: string;
  size: string;              // BigInt → string in constructor
  createdAt: string;         // Date → ISO string in constructor

  constructor(entity: {Entity}) {
    this.id = entity.id;
    this.name = entity.name;
    this.size = entity.size.toString();
    this.createdAt = entity.createdAt.toISOString();
  }
}
```

No `@Expose`/`@Exclude` — all serialization is manual constructor mapping.

---

## BaseResponse Envelope

```typescript
export class BaseResponse<T> {
  success: boolean;
  data?: T;
  message?: string;

  static ok<T>(data?: T, message?: string): BaseResponse<T>;
  static fail<T = never>(message: string): BaseResponse<T>;
}
```

## PaginatedResponse

```typescript
export class PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;   // computed: Math.ceil(total / limit)

  constructor(items: T[], total: number, page: number, limit: number);
}
```

---

## Validation Decorators Used

**String**: `@IsString`, `@IsNotEmpty`, `@MaxLength`, `@MinLength`, `@IsEmail`, `@IsUrl`, `@IsDateString`, `@IsNumberString`
**Number**: `@IsInt`, `@Min`, `@Max`
**UUID**: `@IsUUID('4')`
**Enum**: `@IsEnum(EnumType)`, `@IsIn([...])`
**Boolean**: `@IsBoolean`
**Array**: `@IsArray`, `@ArrayMinSize`, `@ArrayMaxSize`, `{ each: true }`
**Nested**: `@ValidateNested({ each: true })` + `@Type(() => NestedDto)`
**Optional**: `@IsOptional` (always paired with `?`)

### Nested DTO Example

```typescript
export class OrderItemDto {
  @IsUUID('4')
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
```

## Enum Validation Strategy

- `@IsEnum(EnumType)` for domain enums with dedicated enum file
- `@IsIn([...])` for ad-hoc string sets in query DTOs

## Swagger

`@nestjs/swagger` is installed and configured in `main.ts` but zero `@ApiProperty`/`@ApiOperation`/`@ApiResponse` decorators are used. Swagger UI renders auto-inferred schemas only.
