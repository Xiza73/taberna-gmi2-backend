# Ecommerce GMI2

API REST para un ecommerce completo orientado a un vendedor minorista en Peru. Incluye storefront (cliente) y backoffice (admin).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (Express) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL 16 + TypeORM |
| Auth | JWT + bcrypt |
| Payments | MercadoPago (Checkout Pro) |
| Search | Elasticsearch + Kibana |
| Images | Cloudinary |
| Email | Nodemailer (SMTP) |
| Validation | class-validator + class-transformer |
| Security | helmet + @nestjs/throttler |
| Testing | Jest + supertest |

## Architecture

Clean Architecture (4 layers) per module:

```
presentation  → application (use cases, DTOs)
application   → domain (entities, interfaces, enums)
infrastructure → domain (implements interfaces, maps entities)
domain        → shared/domain ONLY
```

## Modules (19)

| Module | Description |
|---|---|
| Shared | Base infra: entities, VOs, guards, filters, exceptions |
| Auth | JWT login, register, refresh token rotation, password reset |
| Users | Profile management, admin user CRUD |
| Categories | Hierarchical categories (parent/child) |
| Products | Catalog with images, stock, filters |
| Banners | Promotional banners for storefront |
| Cart | Shopping cart per user |
| Addresses | Shipping addresses (max 10 per user) |
| Coupons | Discount coupons (percentage/fixed) |
| Orders | Checkout, order lifecycle, state machine |
| Payments | MercadoPago integration, webhooks |
| Shipping | Carrier tracking (Shalom, SerPost, Olva, DHL) |
| Reviews | Product reviews with admin approval |
| Admin | Dashboard and reports (orchestration) |
| Wishlist | User wishlists |
| Uploads | Image uploads via Cloudinary |
| Notifications | Transactional emails |
| Logging | Request logging to Elasticsearch |
| Search | Full-text search with fuzzy matching |

## Prerequisites

- Node.js 20+
- pnpm
- Docker & Docker Compose (for PostgreSQL, Elasticsearch, Kibana)

## Setup

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Elasticsearch, Kibana)
docker compose up -d

# Copy environment variables
cp .env.example .env

# Run migrations
pnpm run migration:run

# Start dev server
pnpm run start:dev
```

## Environment Variables

See `.env.example` for the full list. Required secrets:

| Variable | Description |
|---|---|
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | Min 32 chars, not placeholder |
| `MERCADOPAGO_ACCESS_TOKEN` | MercadoPago API token |
| `MERCADOPAGO_WEBHOOK_SECRET` | Webhook HMAC secret |

The app will **not start** if required secrets are missing.

## Scripts

```bash
pnpm run start:dev       # Development (watch mode)
pnpm run start:prod      # Production
pnpm run build           # Build
pnpm run test            # Unit tests
pnpm run test:e2e        # E2E tests
pnpm run test:cov        # Coverage
pnpm run migration:run   # Run migrations
pnpm run migration:gen   # Generate migration
```

## API

Base URL: `http://localhost:3000/api/v1`

All responses use the envelope format:
```json
{
  "success": true,
  "data": { ... },
  "message": "optional"
}
```

**Roles**: `customer` (storefront) and `admin` (backoffice).

## Documentation

| File | Description |
|---|---|
| [docs/CONTEXT.md](docs/CONTEXT.md) | Project context index |
| [docs/CONTEXT-GLOBAL.md](docs/CONTEXT-GLOBAL.md) | Global config, DB schema, constraints |
| [docs/modules/](docs/modules/) | Per-module specs (19 files) |
| [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md) | 18-phase build plan |
| [docs/CHANGELOG-DESIGN.md](docs/CHANGELOG-DESIGN.md) | Design decisions log (R1-R14) |

## License

MIT
