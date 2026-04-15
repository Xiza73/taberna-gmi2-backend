# Database & ORM Patterns

## Domain Entity Pattern

### Architecture (framework-agnostic)

- Domain entities are pure TypeScript classes with zero ORM imports
- Protected/private constructor enforced via static factory methods
- `create()` validates invariants and generates UUID
- `reconstitute()` hydrates from persistence without validation
- All fields private (`_camelCase`) with public getters (no setters)
- State changes via named behavior methods that call `markUpdated()`
- Extends `BaseEntity` (provides `id`, `createdAt`, `updatedAt`)

### NestJS Implementation

```typescript
export class {Entity} extends BaseEntity {
  private _{field}: {Type};

  private constructor(id: string, {field}: {Type}, createdAt: Date, updatedAt: Date) {
    super(id, createdAt, updatedAt);
    this._{field} = {field};
  }

  static create(props: { {field}: {Type} }): {Entity} {
    if (!props.{field}) throw new DomainException('{message}');
    // undefined! for id — BaseEntity.constructor generates a UUID via randomUUID()
    return new {Entity}(undefined!, props.{field}, new Date(), new Date());
  }

  static reconstitute(props: { id: string; {field}: {Type}; createdAt: Date; updatedAt: Date }): {Entity} {
    return new {Entity}(props.id, props.{field}, props.createdAt, props.updatedAt);
  }

  get {field}(): {Type} { return this._{field}; }

  {action}(): void {
    if (this._invalidState) throw new DomainException('{reason}');
    this._{field} = newValue;
    this.markUpdated();
  }
}
```

### Value Objects

```typescript
export class {ValueObject} {
  private readonly _value: {Primitive};
  private constructor(value: {Primitive}) { this._value = value; }

  static create(value: {Primitive}): {ValueObject} {
    if (/* invalid */) throw new DomainException('{message}');
    return new {ValueObject}(value);
  }
  static fromExisting(value: {Primitive}): {ValueObject} { return new {ValueObject}(value); }
}
```

Available: `Money` (amount + currency), `Email`, `Address` (street, city, state, zip, country), `Slug` (URL-safe string), `PhoneNumber`.

---

## ORM Entity Pattern

### Architecture (framework-agnostic)

- Separate class from domain entity (persistence model)
- Pure data container, no business logic
- Maps to database table with explicit column naming

### NestJS Implementation (TypeORM)

```typescript
@Entity('{table_name}')
@Index('IDX_{table}_{columns}', ['{col1}', '{col2}'])
export class {Entity}OrmEntity {
  @PrimaryColumn('uuid')
  id: string;                                  // App-generated UUID

  @Column({ type: '{db_type}', name: '{snake_case}' })
  {camelCase}: {TSType};

  @Column({ type: 'integer', default: 0 })
  price: number;                               // price in cents (integer)

  @ManyToOne(() => {Related}OrmEntity, { onDelete: '{CASCADE|SET NULL}', nullable: true })
  @JoinColumn({ name: '{fk_column}' })
  {relation}?: {Related}OrmEntity;

  @Column({ type: 'uuid', name: '{fk_column}' })
  {relationId}: string;                        // Scalar FK used in queries

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
```

Naming: File `*.orm-entity.ts`, Class `*OrmEntity`, Table `snake_case` plural, Columns `snake_case` via `name:`.

---

## Mapper Pattern

### Architecture (framework-agnostic)

- Static utility class (no @Injectable, no state)
- Two methods: `toDomain(orm)` and `toOrm(domain)`
- Handles all type conversions at persistence boundary

### NestJS Implementation

```typescript
export class {Entity}Mapper {
  static toDomain(orm: {Entity}OrmEntity): {Entity} {
    return {Entity}.reconstitute({
      id: orm.id,
      price: orm.price,                 // integer (cents) — no conversion needed
      email: orm.email,                 // passed to reconstitute which creates value object
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: {Entity}): {Entity}OrmEntity {
    const orm = new {Entity}OrmEntity();
    orm.id = domain.id;
    orm.price = domain.price;           // integer (cents) — direct assignment
    // Note: createdAt/updatedAt NOT set (TypeORM manages via decorators)
    return orm;
  }
}
```

---

## Repository Implementation

```typescript
@Injectable()
export class {Entity}Repository implements I{Entity}Repository {
  constructor(
    @InjectRepository({Entity}OrmEntity)
    private readonly repo: Repository<{Entity}OrmEntity>,
  ) {}

  async save(entity: {Entity}): Promise<{Entity}> {
    const orm = {Entity}Mapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return {Entity}Mapper.toDomain(saved);
  }

  async findById(id: string): Promise<{Entity} | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? {Entity}Mapper.toDomain(entity) : null;
  }
}
```

Three query strategies: `repo.find/findOne` (simple), `repo.createQueryBuilder()` (dynamic), `repo.query()` (recursive CTEs, raw SQL).

---

## Connection Configuration

```typescript
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get('DB_HOST', 'localhost'),
    port: config.get('DB_PORT', 5432),
    database: config.get('DB_NAME'),
    username: config.get('DB_USERNAME', 'postgres'),
    password: config.get('DB_PASSWORD', 'postgres'),
    autoLoadEntities: true,
    synchronize: false,
    migrationsRun: true,
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    extra: { options: '-c timezone=UTC' },
  }),
})
```

---

## Migrations

See [migrations.md](migrations.md) for full migration workflow, CLI commands, and conventions.

Key points:
- ORM entities are the single source of truth — auto-generate with `pnpm migration:generate`
- `synchronize: false` always, `migrationsRun: true` for auto-execution
- Postgres features: `pg_trgm`, `gin_trgm_ops`, partial indexes, recursive CTEs, `timestamptz`
