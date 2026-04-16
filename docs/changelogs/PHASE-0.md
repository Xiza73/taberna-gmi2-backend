# Phase 0: Project Setup — Changelog

**Fecha**: 2026-04-15
**Goal**: Proyecto configurado y listo para generar módulos.

---

## Tareas ejecutadas

### 1. Dependencias instaladas

**Core:**
- `@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `pg`
- `@nestjs/jwt`, `@nestjs/throttler`, `@nestjs/schedule`, `@nestjs/terminus`
- `class-validator`, `class-transformer`
- `bcryptjs`, `helmet`, `uuid`, `sanitize-html`

**Payments + Uploads + Email:**
- `mercadopago`, `cloudinary`, `nodemailer`

**Elasticsearch:**
- `@nestjs/elasticsearch`, `@elastic/elasticsearch`

**Dev types:**
- `@types/nodemailer`, `@types/multer`, `@types/sanitize-html`

**Adicional (no en plan original):**
- `dotenv` — requerido por `typeorm.config.ts` para leer `.env` en CLI de migraciones.

### 2. tsconfig.json — Path aliases

```json
"paths": {
  "@shared/*": ["src/shared/*"],
  "@modules/*": ["src/modules/*"],
  "@test/*": ["test/*"]
}
```

### 3. nest-cli.json

Agregado `tsConfigPath: "tsconfig.json"` y array `plugins: []` vacío preparado para futuros plugins.

### 4. docker-compose.yml

Creado con los 3 servicios según spec:
- PostgreSQL 16-alpine (port 5432)
- Elasticsearch 8.17.0 (port 9200)
- Kibana 8.17.0 (port 5601)

### 5. .env y .env.example

Creados con las 22 variables de entorno definidas en CONTEXT-GLOBAL.md.

### 6. src/config/typeorm.config.ts

DataSource para CLI de migraciones con:
- `entities: ['dist/**/*.orm-entity.js']`
- `migrations: ['dist/migrations/*.js']`
- `synchronize: false`

### 7. Migration scripts (package.json)

5 scripts agregados: `migration:generate`, `migration:create`, `migration:run`, `migration:revert`, `migration:show`.

---

## Correcciones post-validación

### F1: `src/migrations/` no existía

**Problema**: El `typeorm.config.ts` referencia `dist/migrations/*.js`, pero no existía el directorio fuente `src/migrations/`.
**Fix**: Creado `src/migrations/` con `.gitkeep` para que git lo trackee vacío.
**Por qué**: Sin este directorio, `migration:generate` no tiene ubicación de salida por defecto.

### F2: Jest `moduleNameMapper` faltante

**Problema**: Los path aliases `@shared/*`, `@modules/*`, `@test/*` estaban configurados en `tsconfig.json` pero no en la config de Jest (unit ni e2e). Cualquier test usando estos aliases fallaría.
**Fix**:
- `package.json` → jest → `moduleNameMapper` agregado (unit tests)
- `test/jest-e2e.json` → `moduleNameMapper` agregado (e2e tests)
**Por qué**: TypeScript y Jest usan resolvers diferentes. `tsconfig paths` solo funciona en compilación, Jest necesita su propio mapper.

### F3: `strict: true` no estaba habilitado

**Problema**: CLAUDE.md dice "TypeScript (strict mode)" pero `tsconfig.json` tenía flags individuales (`strictNullChecks`, `noImplicitAny`, `strictBindCallApply`) en vez de `strict: true`. Faltaban: `strictFunctionTypes`, `noImplicitThis`, `alwaysStrict`, `useUnknownInCatchVariables`.
**Fix**: Reemplazados los flags individuales por `"strict": true` + `"strictPropertyInitialization": false`.
**Por qué**: `strict: true` habilita todas las verificaciones estrictas de golpe. Se desactiva `strictPropertyInitialization` porque `class-validator` DTOs usan propiedades sin inicializar con decoradores, lo cual es incompatible con ese flag.

---

## Desviaciones del plan original

| Item | Plan | Implementación | Razón |
|------|------|----------------|-------|
| `@types/bcryptjs` | Instalar | No instalado | `bcryptjs@3.x` incluye sus propios `.d.ts` — el paquete `@types/bcryptjs` está deprecated |
| `@types/uuid` | Instalar | No instalado | `uuid@13.x` incluye sus propios `.d.ts` — el paquete `@types/uuid` está deprecated |
| `dotenv` | No mencionado | Instalado | Requerido por `typeorm.config.ts` para que el CLI de migraciones lea `.env` |
| `strict: true` | No especificado en Phase 0 | Habilitado | CLAUDE.md requiere "strict mode"; `strictPropertyInitialization` deshabilitado por compatibilidad con class-validator |
| Jest `moduleNameMapper` | No mencionado en Phase 0 | Configurado | Necesario para que los tests resuelvan los path aliases de `tsconfig.json` |
| `src/migrations/` | No mencionado en Phase 0 | Creado con `.gitkeep` | Directorio necesario para que `migration:generate` funcione |

---

## Validación final

| Check | Estado |
|-------|--------|
| `pnpm run build` compila sin errores | PASS |
| Todas las dependencias del plan instaladas | PASS |
| Path aliases configurados (TS + Jest) | PASS |
| docker-compose.yml con 3 servicios | PASS |
| .env y .env.example con 22 variables | PASS |
| typeorm.config.ts para CLI migraciones | PASS |
| 5 migration scripts en package.json | PASS |
| .gitignore excluye .env | PASS |
| strict mode habilitado | PASS |
| src/migrations/ existe | PASS |
