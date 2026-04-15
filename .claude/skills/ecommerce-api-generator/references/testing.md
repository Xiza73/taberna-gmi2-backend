# Testing Patterns

## Test Stack

| Tool | Purpose |
|---|---|
| Jest 29.7 + ts-jest | Test runner + TypeScript transform |
| @nestjs/testing | `Test.createTestingModule` builder |
| supertest | HTTP assertions for E2E |

---

## Unit Test Patterns

### Pattern 1: Domain Entity Tests (Pure)

No DI container, no mocks. Builder helpers with overrides pattern.

```typescript
describe('{Entity}', () => {
  function buildProps(overrides: Partial<Parameters<typeof {Entity}.create>[0]> = {}) {
    return { name: 'default', size: 1024n, ...overrides };
  }

  function reconstitute(overrides = {}) {
    return {Entity}.reconstitute({ id: 'uuid', name: 'default', ...overrides });
  }

  describe('create', () => {
    it('should create with defaults', () => {
      const entity = {Entity}.create(buildProps());
      expect(entity.name).toBe('default');
    });

    it('should throw on invalid input', () => {
      expect(() => {Entity}.create(buildProps({ name: '' }))).toThrow(DomainException);
      expect(() => {Entity}.create(buildProps({ name: '' }))).toThrow('Name is required');
    });
  });
});
```

### Pattern 2: Use Case Tests (DI Container)

```typescript
jest.mock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('hashed'), compare: jest.fn() }));

describe('{Action}UseCase', () => {
  let useCase: {Action}UseCase;
  let repository: ReturnType<typeof createMock{Entity}Repository>;

  beforeEach(async () => {
    repository = createMock{Entity}Repository();
    repository.save.mockImplementation((entity) => Promise.resolve(entity));

    const module = await Test.createTestingModule({
      providers: [
        {Action}UseCase,
        { provide: {ENTITY}_REPOSITORY, useValue: repository },
      ],
    }).compile();

    useCase = module.get({Action}UseCase);
  });

  it('should throw for invalid state', async () => {
    await expect(useCase.execute(dto)).rejects.toThrow(DomainForbiddenException);
    await expect(useCase.execute(dto)).rejects.toThrow(ErrorMessages.{CONSTANT});
  });
});
```

---

## Mock Infrastructure

### Mock Repository Factory (`test/helpers/mock-repository.factory.ts`)

```typescript
type MockOf<T> = { [K in keyof T]: jest.Mock };

export function createMock{Entity}Repository(): MockOf<I{Entity}Repository> {
  return { findById: jest.fn(), save: jest.fn(), /* every interface method */ };
}
```

Mock factories for each repository + `createMockPaymentProvider`, `createMockPriceCalculator`.

### Test Data Factory (`test/helpers/test-data.factory.ts`)

```typescript
export function createTest{Entity}(overrides = {}): {Entity} {
  return {Entity}.reconstitute({
    id: randomUUID(), name: 'default', ...overrides,
  });
}
```

Data factories for each entity using `Entity.reconstitute()` with sensible defaults.

---

## E2E Test Patterns

### Bootstrap

```typescript
describe('Feature (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PAYMENT_PROVIDER)
      .useValue(new MockPaymentProvider())
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);       // TRUNCATE CASCADE
    await seedCategories(dataSource);     // Raw SQL
    user = await seedUser(dataSource);
  });
});
```

- Real `AppModule` + real PostgreSQL (database name from `DB_NAME` env var, typically `{project}_test`)
- Only `PAYMENT_PROVIDER` overridden with `MockPaymentProvider`
- Auth via `authHeader(user)` helper generating real JWTs

### Response Assertions

```typescript
expect(res.status).toBe(200);
expect(res.body.success).toBe(true);
expect(res.body.data).toBeDefined();
```

---

## Pattern 3: Controller Tests (Unit)

```typescript
describe('{Resource}Controller', () => {
  let controller: {Resource}Controller;
  let {action}UseCase: { execute: jest.Mock };

  beforeEach(async () => {
    {action}UseCase = { execute: jest.fn() };

    const module = await Test.createTestingModule({
      controllers: [{Resource}Controller],
      providers: [
        { provide: {Action}UseCase, useValue: {action}UseCase },
      ],
    }).compile();

    controller = module.get({Resource}Controller);
  });

  it('should return BaseResponse.ok with result', async () => {
    const expected = new {Entity}ResponseDto(createTest{Entity}());
    {action}UseCase.execute.mockResolvedValue(expected);

    const result = await controller.get(mockUser, 'some-id');

    expect(result).toEqual(BaseResponse.ok(expected));
    expect({action}UseCase.execute).toHaveBeenCalledWith('some-id', mockUser.id);
  });
});
```

- Mock use cases directly (no repository mocks needed)
- Verify `BaseResponse.ok()` wrapping
- Verify correct arguments passed to use case
