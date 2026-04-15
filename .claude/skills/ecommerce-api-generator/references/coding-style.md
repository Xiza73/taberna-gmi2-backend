# Coding Style Profile

## Formatting

- **Prettier**: single quotes, trailing commas `all`, LF line endings
- **ESLint**: flat config, typescript-eslint recommended, `@typescript-eslint/no-explicit-any: off`
- **TypeScript**: `strictNullChecks`, `noImplicitAny`, `target: ES2021`, `module: commonjs`
- **Path aliases**: `@shared/*` → `src/shared/*`, `@modules/*` → `src/modules/*`, `@test/*` → `test/*`

## Style Signals

| Signal | Pattern |
|---|---|
| Decorators | Moderate — only where NestJS requires; no Swagger decorators |
| Classes | Heavily class-based (entities, use cases, repos, mappers, DTOs, exceptions) |
| Exports | Named exclusively (no default exports) |
| DI | Constructor injection; `@Inject(SYMBOL)` for interfaces; all params `private readonly` |
| Async | `async/await` exclusively; no RxJS in app/domain |
| Comments | Minimal — section separators in modules, brief inline clarifications; no JSDoc |
| Imports | `@nestjs/*` → third-party → `@shared/*`/`@modules/*` → relative |
| Types | Interfaces for contracts, types rare, enums for constants |
| Errors | Custom exception hierarchy; domain exceptions bubble to global filter |
| File length | DTOs: 5-15 lines; Use cases: 40-120; Controllers: 200-400; Repos: 200-460 |
| Logger | `private readonly logger = new Logger(ClassName.name)` in infrastructure only |
| Response | `BaseResponse.ok(result)` everywhere |

## Enum Convention

```typescript
export enum {EnumName} {
  MEMBER_ONE = 'member_one',    // UPPER_SNAKE = 'lower_snake'
  MEMBER_TWO = 'member_two',
}
```

## Constructor Parameter Ordering

1. `@Inject(SYMBOL)` repository dependencies first
2. Direct class-injected services after
3. NestJS built-ins (`ConfigService`, `JwtService`) last

## Barrel Exports

Only in `shared/domain/exceptions/index.ts` and `shared/domain/value-objects/index.ts`. Module-level code uses direct file imports.
