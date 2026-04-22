# Implementation Plan

## Dependency Graph

```
Phase 0: Project Setup (config, deps, docker-compose con PG + ES + Kibana)
    │
Phase 1: Shared Infrastructure + Logging Middleware
    │
Phase 2: Auth + Customers + Staff ─────────┐
    │                                       │
Phase 3: Categories                         │
    │                                       │
Phase 4: Products ──────────────────────────┤
    │                                       │
Phase 5: Banners                            │
    │                                       │
Phase 6: Uploads (Cloudinary)               │
    │                                       │
Phase 7: Cart + Addresses ─────────────────┤
    │                                       │
Phase 8: Wishlist                           │
    │                                       │
Phase 9: Coupons                            │
    │                                       │
Phase 10: Payments ───────────────────────┤ (entity + IPaymentProvider, sin controller de webhook aun)
    │                                       │
Phase 11: Orders ──────────────────────────┤ (depends on: products, cart, addresses, coupons, payments, users)
    │                                       │  includes: atomic stock, order expiration cron, webhook controller
    │                                       │
Phase 12: Shipping ────────────────────────┤ (depends on: orders, Phase 11)
    │                                       │
Phase 13: Notifications ───────────────────┤ (depends on: orders, users, shipping)
    │                                       │
Phase 14: Reviews ─────────────────────────┤ (depends on: products, orders, users)
    │                                       │
Phase 15: Admin Dashboard ─────────────────┘ (depends on: orders, products, users)
    │
Phase 16: Search (Elasticsearch)
    │
Phase 17: Final (seed, health check, e2e tests)
    │
Phase 18: Google OAuth (depends on: auth, users)
```

---

## Phase 0: Project Setup

**Goal**: Proyecto configurado y listo para generar modulos.

**Tasks:**
1. Instalar dependencias:
   ```bash
   # Core
   pnpm add @nestjs/config @nestjs/typeorm typeorm pg
   pnpm add @nestjs/jwt @nestjs/throttler @nestjs/schedule @nestjs/terminus
   pnpm add class-validator class-transformer
   pnpm add bcryptjs helmet uuid sanitize-html

   # Payments + Uploads + Email
   pnpm add mercadopago cloudinary nodemailer

   # Elasticsearch
   pnpm add @nestjs/elasticsearch @elastic/elasticsearch

   # Dev
   pnpm add -D @types/bcryptjs @types/uuid @types/nodemailer @types/multer @types/sanitize-html
   ```

2. Configurar `tsconfig.json` path aliases:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@shared/*": ["src/shared/*"],
         "@modules/*": ["src/modules/*"],
         "@test/*": ["test/*"]
       }
     }
   }
   ```

3. Configurar `nest-cli.json` con webpack paths.

4. Crear `docker-compose.yml` (PostgreSQL + Elasticsearch + Kibana):
   ```yaml
   services:
     postgres:
       image: postgres:16-alpine
       environment:
         POSTGRES_DB: ecommerce_gmi2
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
       ports:
         - "5432:5432"
       volumes:
         - pgdata:/var/lib/postgresql/data

     elasticsearch:
       image: docker.elastic.co/elasticsearch/elasticsearch:8.17.0
       environment:
         - discovery.type=single-node
         - xpack.security.enabled=false
         - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
       ports:
         - "9200:9200"
       volumes:
         - esdata:/var/lib/elasticsearch/data

     kibana:
       image: docker.elastic.co/kibana/kibana:8.17.0
       environment:
         - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
       ports:
         - "5601:5601"
       depends_on:
         - elasticsearch
   volumes:
     pgdata:
     esdata:
   ```

5. Crear `.env` y `.env.example` (ver CONTEXT.md)

6. Crear `src/config/typeorm.config.ts` (CLI para migraciones)

7. Agregar scripts a `package.json`:
   ```json
   {
     "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/config/typeorm.config.ts",
     "migration:create": "typeorm-ts-node-commonjs migration:create",
     "migration:run": "typeorm-ts-node-commonjs migration:run -d src/config/typeorm.config.ts",
     "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/config/typeorm.config.ts",
     "migration:show": "typeorm-ts-node-commonjs migration:show -d src/config/typeorm.config.ts"
   }
   ```

**Output**: `pnpm run build` compila sin errores. Docker Compose levanta PostgreSQL.

---

## Phase 1: Shared Infrastructure

**Skill**: `/ecommerce-api-generator shared`

**Genera:**
```
src/shared/
  shared.module.ts                          # @Global
  domain/
    entities/base.entity.ts                 # BaseEntity (id, createdAt, updatedAt)
    value-objects/
      money.vo.ts                           # amount (cents) + currency
      email.vo.ts                           # validated email
      slug.vo.ts                            # URL-safe string
      phone-number.vo.ts                    # phone validation
      address-snapshot.vo.ts                # para snapshots en ordenes (evita colision con entity Address)
      index.ts                              # barrel export
    exceptions/
      domain.exception.ts                   # base → 400
      domain-unauthorized.exception.ts      # → 401
      domain-not-found.exception.ts         # → 404
      domain-forbidden.exception.ts         # → 403
      domain-conflict.exception.ts          # → 409
      index.ts                              # barrel export
    interfaces/
      base-repository.interface.ts          # IBaseRepository<T> (includes withTransaction(ctx): this)
      unit-of-work.interface.ts             # IUnitOfWork + TransactionContext (opaco, infra castea a EntityManager)
    enums/
      subject-type.enum.ts               # SubjectType: CUSTOMER | STAFF
      staff-role.enum.ts                 # StaffRole: SUPER_ADMIN | ADMIN | USER
    constants/
      error-messages.ts                     # ErrorMessages object
  infrastructure/
    typeorm-unit-of-work.ts                 # implements IUnitOfWork (usa QueryRunner, pasa queryRunner.manager como TransactionContext)
  application/
    dtos/
      base-response.dto.ts                  # BaseResponse<T>
      pagination.dto.ts                     # PaginationDto + PaginatedResponseDto (MAX_PAGE_SIZE = 50)
  presentation/
    decorators/
      public.decorator.ts                   # @Public()
      subject-type.decorator.ts          # @RequireSubjectType(STAFF)
      staff-role.decorator.ts            # @RequireStaffRole(SUPER_ADMIN, ADMIN)
      current-user.decorator.ts             # @CurrentUser()
    guards/
      jwt-auth.guard.ts                     # JwtAuthGuard
      subject-type.guard.ts              # SubjectTypeGuard
      staff-role.guard.ts                # StaffRoleGuard
    filters/
      global-exception.filter.ts             # @Catch() — handles DomainException + HttpException → BaseResponse
    middleware/
      logging.middleware.ts                  # Request logging → Elasticsearch
    interfaces/
      authenticated-user.interface.ts       # AuthenticatedUser shape
```

**Logging middleware**: Cada request se logea a Elasticsearch con method, path, status, duration, userId, ip. Index: `ecommerce-logs-YYYY.MM.DD`. Kibana disponible en `http://localhost:5601`.

**Validation**: `docker compose up -d` levanta PG + ES + Kibana. `pnpm run build` OK.

---

## Phase 2: Auth + Customers + Staff

**Skill**: `/ecommerce-api-generator auth` luego `/ecommerce-api-generator customers` luego `/ecommerce-api-generator staff`

### Auth Module
```
src/modules/auth/
  auth.module.ts
  domain/
    entities/refresh-token.entity.ts
    interfaces/refresh-token-repository.interface.ts
    enums/                                  # (SubjectType y StaffRole enums movidos a src/shared/domain/enums/)
  infrastructure/
    orm-entities/refresh-token.orm-entity.ts
    repositories/refresh-token.repository.ts
    mappers/refresh-token.mapper.ts
    strategies/jwt.strategy.ts              # JwtStrategy (validate: load customer or staff + check isActive, cache 30s)
    cron/refresh-token-cleanup.cron.ts     # @Cron('0 0 3 * * 0') semanal, purga tokens expirados/revocados
  application/
    dtos/register.dto.ts, login.dto.ts, refresh-token.dto.ts, auth-tokens-response.dto.ts, forgot-password.dto.ts, reset-password.dto.ts
    use-cases/register.use-case.ts, login.use-case.ts, refresh-token.use-case.ts, logout.use-case.ts, get-me.use-case.ts, forgot-password.use-case.ts, reset-password.use-case.ts
  presentation/auth.controller.ts
```

### Customers Module
```
src/modules/customers/
  customers.module.ts
  domain/
    entities/customer.entity.ts
    interfaces/customer-repository.interface.ts
  infrastructure/
    orm-entities/customer.orm-entity.ts
    repositories/customer.repository.ts
    mappers/customer.mapper.ts
  application/
    dtos/update-customer-profile.dto.ts, change-password.dto.ts, customer-response.dto.ts, customer-query.dto.ts
    use-cases/get-customer-profile.use-case.ts, update-customer-profile.use-case.ts, change-customer-password.use-case.ts
    use-cases/admin-list-customers.use-case.ts, admin-get-customer.use-case.ts, admin-update-customer.use-case.ts, suspend-customer.use-case.ts, activate-customer.use-case.ts
  presentation/customers.controller.ts, admin-customers.controller.ts
```

### Staff Module
```
src/modules/staff/
  staff.module.ts
  domain/
    entities/staff-member.entity.ts, staff-invitation.entity.ts
    interfaces/staff-member-repository.interface.ts, staff-invitation-repository.interface.ts
  infrastructure/
    orm-entities/staff-member.orm-entity.ts, staff-invitation.orm-entity.ts
    repositories/staff-member.repository.ts, staff-invitation.repository.ts
    mappers/staff-member.mapper.ts, staff-invitation.mapper.ts
  application/
    dtos/invite-staff.dto.ts, accept-invitation.dto.ts, staff-member-response.dto.ts, staff-query.dto.ts, update-staff-role.dto.ts
    use-cases/invite-staff.use-case.ts, validate-invitation.use-case.ts, accept-invitation.use-case.ts, list-invitations.use-case.ts, revoke-invitation.use-case.ts
    use-cases/get-staff-profile.use-case.ts, update-staff-profile.use-case.ts, change-staff-password.use-case.ts
    use-cases/admin-list-staff.use-case.ts, admin-get-staff.use-case.ts, update-staff-role.use-case.ts, suspend-staff.use-case.ts, activate-staff.use-case.ts
  presentation/admin-staff.controller.ts, staff-invitations.controller.ts
```

**Migration**: `pnpm migration:generate src/migrations/CreateCustomersStaffAndRefreshTokens`

**Nota DI**:
- CustomersModule DEBE exportar `CUSTOMER_REPOSITORY` para que JwtAuthGuard pueda inyectarlo.
- StaffModule DEBE exportar `STAFF_MEMBER_REPOSITORY` para que JwtAuthGuard pueda inyectarlo.
- AuthModule DEBE exportar `JwtModule` para que JwtAuthGuard pueda resolver `JwtService` a nivel de AppModule.
- AuthModule importa CustomersModule y StaffModule para acceder a los repositorios.

**Validation**: Register + login + refresh + me funcionan. Refresh token cleanup cron registrado. `pnpm run build` OK.

---

## Phase 3: Categories

**Skill**: `/ecommerce-api-generator categories`

```
src/modules/categories/
  categories.module.ts
  domain/
    entities/category.entity.ts
    interfaces/category-repository.interface.ts
  infrastructure/
    orm-entities/category.orm-entity.ts
    repositories/category.repository.ts     # includes tree queries (recursive CTE)
    mappers/category.mapper.ts
  application/
    dtos/create-category.dto.ts, update-category.dto.ts, category-response.dto.ts, category-query.dto.ts
    use-cases/list-categories.use-case.ts, get-category-by-slug.use-case.ts
    use-cases/admin-list-categories.use-case.ts, admin-get-category.use-case.ts, create-category.use-case.ts, update-category.use-case.ts, delete-category.use-case.ts
  presentation/categories.controller.ts, admin-categories.controller.ts
```

**Migration**: `pnpm migration:generate src/migrations/CreateCategories`

---

## Phase 4: Products

**Skill**: `/ecommerce-api-generator products`

```
src/modules/products/
  products.module.ts
  domain/
    entities/product.entity.ts
    interfaces/product-repository.interface.ts
    interfaces/product-search-sync.interface.ts  # IProductSearchSync + PRODUCT_SEARCH_SYNC token
    # Products use cases usan @Optional() @Inject(PRODUCT_SEARCH_SYNC). SearchModule se importa en Phase 16.
  infrastructure/
    orm-entities/product.orm-entity.ts
    repositories/product.repository.ts      # dynamic query builder for filters
    mappers/product.mapper.ts
  application/
    dtos/create-product.dto.ts, update-product.dto.ts, product-response.dto.ts, product-query.dto.ts, adjust-stock.dto.ts
    use-cases/list-products.use-case.ts, get-product-by-slug.use-case.ts
    use-cases/admin-list-products.use-case.ts, admin-get-product.use-case.ts, create-product.use-case.ts, update-product.use-case.ts, delete-product.use-case.ts, adjust-stock.use-case.ts
  presentation/products.controller.ts, admin-products.controller.ts
```

**Migration**: `pnpm migration:generate src/migrations/CreateProducts`

**Index**: GIN trigram index en `products.name` para busqueda (migration manual):
```bash
pnpm migration:create src/migrations/AddProductNameTrigramIndex
```

---

## Phase 5: Banners

**Skill**: `/ecommerce-api-generator banners`

```
src/modules/banners/
  banners.module.ts
  domain/
    entities/banner.entity.ts
    enums/banner-position.enum.ts
    interfaces/banner-repository.interface.ts
  infrastructure/
    orm-entities/banner.orm-entity.ts
    repositories/banner.repository.ts
    mappers/banner.mapper.ts
  application/
    dtos/create-banner.dto.ts, update-banner.dto.ts, banner-response.dto.ts
    use-cases/list-active-banners.use-case.ts
    use-cases/admin-list-banners.use-case.ts, admin-get-banner.use-case.ts, create-banner.use-case.ts, update-banner.use-case.ts, delete-banner.use-case.ts
  presentation/banners.controller.ts, admin-banners.controller.ts
```

**Migration**: `pnpm migration:generate src/migrations/CreateBanners`

---

## Phase 6: Uploads (Cloudinary)

**Skill**: `/ecommerce-api-generator uploads`

**Pattern**: Infrastructure-only module (@Global)

```
src/modules/uploads/
  uploads.module.ts                          # @Global
  domain/
    interfaces/image-uploader.interface.ts   # IImageUploader + IMAGE_UPLOADER token
  infrastructure/
    services/cloudinary-image-uploader.ts    # implements IImageUploader
  application/
    dtos/upload-image-response.dto.ts
    use-cases/upload-image.use-case.ts, delete-image.use-case.ts
  presentation/admin-uploads.controller.ts   # @Roles('admin'), multipart/form-data
```

**No migration** (sin entidades, solo servicio externo).

**Uso**: Admin sube imagen → recibe URL de Cloudinary → usa esa URL en crear/editar producto o banner.

---

## Phase 7: Cart + Addresses

**Skill**: `/ecommerce-api-generator cart` luego `/ecommerce-api-generator addresses`

### Cart Module
```
src/modules/cart/
  cart.module.ts
  domain/
    entities/cart.entity.ts, cart-item.entity.ts
    interfaces/cart-repository.interface.ts
  infrastructure/
    orm-entities/cart.orm-entity.ts, cart-item.orm-entity.ts
    repositories/cart.repository.ts
    mappers/cart.mapper.ts, cart-item.mapper.ts
  application/
    dtos/add-cart-item.dto.ts, update-cart-item.dto.ts, cart-response.dto.ts
    use-cases/get-cart.use-case.ts, add-cart-item.use-case.ts, update-cart-item.use-case.ts, remove-cart-item.use-case.ts, clear-cart.use-case.ts
  presentation/cart.controller.ts
```

### Addresses Module
```
src/modules/addresses/
  addresses.module.ts
  domain/
    entities/address.entity.ts
    interfaces/address-repository.interface.ts
  infrastructure/
    orm-entities/address.orm-entity.ts
    repositories/address.repository.ts
    mappers/address.mapper.ts
  application/
    dtos/create-address.dto.ts, update-address.dto.ts, address-response.dto.ts
    use-cases/list-addresses.use-case.ts, create-address.use-case.ts, update-address.use-case.ts, delete-address.use-case.ts, set-default-address.use-case.ts
  presentation/addresses.controller.ts
```

**Migration**: `pnpm migration:generate src/migrations/CreateCartsAndAddresses`

---

## Phase 8: Wishlist

**Skill**: `/ecommerce-api-generator wishlist`

```
src/modules/wishlist/
  wishlist.module.ts
  domain/
    entities/wishlist-item.entity.ts
    interfaces/wishlist-repository.interface.ts
  infrastructure/
    orm-entities/wishlist-item.orm-entity.ts
    repositories/wishlist.repository.ts
    mappers/wishlist-item.mapper.ts
  application/
    dtos/wishlist-response.dto.ts
    use-cases/list-wishlist.use-case.ts, add-to-wishlist.use-case.ts, remove-from-wishlist.use-case.ts
  presentation/wishlist.controller.ts
```

**Migration**: `pnpm migration:generate src/migrations/CreateWishlist`

---

## Phase 9: Coupons

**Skill**: `/ecommerce-api-generator coupons`

```
src/modules/coupons/
  coupons.module.ts
  domain/
    entities/coupon.entity.ts
    enums/coupon-type.enum.ts
    interfaces/coupon-repository.interface.ts
    services/coupon-calculator.ts            # domain service: calcula descuento (valida uso por usuario)
  infrastructure/
    orm-entities/coupon.orm-entity.ts
    repositories/coupon.repository.ts
    mappers/coupon.mapper.ts
  application/
    dtos/create-coupon.dto.ts, update-coupon.dto.ts, validate-coupon.dto.ts, coupon-response.dto.ts
    use-cases/validate-coupon.use-case.ts
    use-cases/admin-list-coupons.use-case.ts, admin-get-coupon.use-case.ts, create-coupon.use-case.ts, update-coupon.use-case.ts, delete-coupon.use-case.ts
  presentation/coupons.controller.ts, admin-coupons.controller.ts
```

**Migration**: `pnpm migration:generate src/migrations/CreateCoupons`

---

## Phase 10: Payments

**Skill**: `/ecommerce-api-generator payments`

**Pattern**: Full DDD module (NO @Global). Exporta `PAYMENT_PROVIDER` y `PAYMENT_REPOSITORY` tokens.

```
src/modules/payments/
  payments.module.ts                         # exports: [PAYMENT_PROVIDER, PAYMENT_REPOSITORY]
  domain/
    entities/payment.entity.ts
    enums/payment-status.enum.ts
    interfaces/
      payment-repository.interface.ts
      payment-provider.interface.ts          # IPaymentProvider + PAYMENT_PROVIDER token
  infrastructure/
    orm-entities/payment.orm-entity.ts
    repositories/payment.repository.ts
    mappers/payment.mapper.ts
    services/mercado-pago-payment.service.ts # implements IPaymentProvider
  application/
    dtos/payment-response.dto.ts
    use-cases/
      create-payment-preference.use-case.ts  # crea preferencia en MercadoPago
      get-payment-details.use-case.ts        # admin: ver detalle completo del pago
  presentation/
    payments.controller.ts                   # payment details (admin)
```

**Migration**: `pnpm migration:generate src/migrations/CreatePayments`

**Nota**: Este modulo se crea ANTES de Orders para que `IPaymentProvider` este disponible cuando OrdersModule lo necesite.

---

## Phase 11: Orders

**Skill**: `/ecommerce-api-generator orders`

**Depends on**: Users, Products, Cart, Addresses, Coupons, Payments

```
src/modules/orders/
  orders.module.ts
  domain/
    entities/order.entity.ts, order-item.entity.ts, order-event.entity.ts
    enums/order-status.enum.ts
    interfaces/order-repository.interface.ts
    interfaces/order-number-generator.interface.ts  # IOrderNumberGenerator + ORDER_NUMBER_GENERATOR token
  infrastructure/
    orm-entities/order.orm-entity.ts, order-item.orm-entity.ts, order-event.orm-entity.ts
    repositories/order.repository.ts
    mappers/order.mapper.ts, order-item.mapper.ts, order-event.mapper.ts
    services/order-number-generator.ts      # implements IOrderNumberGenerator (table-based counter, NOT SEQUENCE)
    cron/order-expiration.cron.ts           # @Cron('0 */15 * * * *') cada 15 min
  application/
    dtos/create-order.dto.ts, order-response.dto.ts, order-query.dto.ts, update-order-status.dto.ts, update-order-notes.dto.ts, mercado-pago-notification.dto.ts
    use-cases/create-order.use-case.ts, list-my-orders.use-case.ts, get-order.use-case.ts, cancel-order.use-case.ts, retry-payment.use-case.ts
    use-cases/process-payment-notification.use-case.ts, verify-payment.use-case.ts, expire-unpaid-orders.use-case.ts
    use-cases/admin-list-orders.use-case.ts, admin-get-order.use-case.ts, update-order-status.use-case.ts, update-order-notes.use-case.ts
  presentation/orders.controller.ts, admin-orders.controller.ts, webhooks.controller.ts
```

**Migration**: `pnpm migration:generate src/migrations/CreateOrders`

**Indexes y tablas adicionales (migration manual)**:
```bash
pnpm migration:create src/migrations/AddOrderIndexesAndCounter
# idx_orders_pending_created ON orders(created_at) WHERE status = 'pending' — partial index para cron
# idx_orders_user_coupon ON orders(user_id, coupon_id) WHERE coupon_id IS NOT NULL
# idx_orders_user_id ON orders(user_id)
# CREATE TABLE order_number_counters (date DATE PK, last_number INTEGER DEFAULT 0) — gap-free daily counter
```

**Validation**: Flujo completo carrito → orden funciona. OrderEvents se registran en cada cambio de estado.

**Transaccion DB**: `CreateOrderUseCase` wrappea pasos 1-12 del checkout en `unitOfWork.execute(async (ctx) => { ... })`. `ctx` es `TransactionContext` (opaco). Cada repo se usa via `repo.withTransaction(ctx)`. Llamada a MercadoPago (paso 13) fuera de transaccion.

**Webhook raw body**: Configurar `NestFactory.create(AppModule, { rawBody: true })` en `main.ts` para que el webhook pueda verificar la firma HMAC con el body original.

**Stock atomico**: `UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty`. Si affected rows = 0, lanza `INSUFFICIENT_STOCK`.

**Webhook/verify-payment transaccional**: Dentro de `unitOfWork.execute()`: crear/actualizar Payment (INSERT ON CONFLICT external_id) + `UPDATE orders SET status = 'paid' WHERE id = :id AND status = 'pending'` + OrderEvent. Si affected rows = 0 en Order y fue cancelada → registrar Payment como late-payment + log alerta admin. **Verificar monto**: `paymentInfo.transactionAmount === order.total`. Webhook controller siempre retorna 200 (try/catch interno). Usar `@UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }))` en webhook endpoint (incluir whitelist y transform para no perder la config global).

**Cancel (transaccional)**: `CancelOrderUseCase` dentro de `unitOfWork.execute()`: atomic status transition (`WHERE status = 'pending'`), stock restore (ordenado por productId ASC para evitar deadlocks), coupon decrement (`WHERE current_uses > 0`), OrderEvent.

**OrderNumber**: Table-based counter (gap-free, daily reset): `INSERT INTO order_number_counters ... ON CONFLICT DO UPDATE ... RETURNING last_number`. Formato: `ORD-YYYYMMDD-NNN`.

**Order expiration cron**: Busca ordenes `pending` con `SELECT ... FOR UPDATE SKIP LOCKED`. Cada orden en su propia transaccion: atomic status, stock restore (ordenado por productId), coupon decrement, OrderEvent. Loop hasta batch < 50 (max 500). Si falla una orden, rollback solo esa y continuar.

**Proteccion ante fallos:**
- **Firma HMAC**: Verificar `MERCADOPAGO_WEBHOOK_SECRET` en cada webhook antes de procesar
- **Reintentos automaticos**: MercadoPago reintenta webhook hasta 4 veces si no recibe 200
- **Verify-payment**: Fallback si webhook no llego
- **Idempotencia**: Doble-check atomico `WHERE status = 'pending'` previene duplicados
- **Emails fire-and-forget**: try/catch + log error

---

## Phase 12: Shipping

**Skill**: `/ecommerce-api-generator shipping`

```
src/modules/shipping/
  shipping.module.ts
  domain/
    entities/shipment.entity.ts
    enums/carrier.enum.ts, shipment-status.enum.ts  # shipped / in_transit / delivered
    interfaces/shipment-repository.interface.ts
    services/tracking-url-generator.ts       # domain service: genera URL segun carrier
  infrastructure/
    orm-entities/shipment.orm-entity.ts
    repositories/shipment.repository.ts
    mappers/shipment.mapper.ts
  application/
    dtos/create-shipment.dto.ts, update-shipment.dto.ts, shipment-response.dto.ts
    use-cases/get-shipment.use-case.ts, create-shipment.use-case.ts, update-shipment.use-case.ts
  presentation/shipments.controller.ts, admin-shipments.controller.ts
```

**Migration**: `pnpm migration:generate src/migrations/CreateShipments`

**Domain Service** `TrackingUrlGenerator`:
```typescript
const CARRIER_TEMPLATES = {
  shalom: 'https://www.shalom.com.pe/tracking/{trackingNumber}',
  serpost: 'https://tracking.serpost.com.pe/tracking/{trackingNumber}',
  olva: 'https://www.olvacourier.com/rastreo/{trackingNumber}',
  dhl: 'https://www.dhl.com/pe-es/home/rastreo.html?tracking-id={trackingNumber}',
};
```

---

## Phase 13: Notifications

**Skill**: `/ecommerce-api-generator notifications`

**Pattern**: Infrastructure-only module (@Global)

```
src/modules/notifications/
  notifications.module.ts                    # @Global
  domain/
    interfaces/email-sender.interface.ts     # IEmailSender + EMAIL_SENDER token
  infrastructure/
    services/nodemailer-email-sender.ts      # implements IEmailSender (SMTP)
    templates/                               # HTML email templates (strings/files)
      order-confirmation.template.ts
      payment-confirmed.template.ts
      order-shipped.template.ts
      order-delivered.template.ts           # pedido entregado + invitacion a review
      password-reset.template.ts            # link de reset de password
      welcome.template.ts
```

**No migration** (sin entidades).

**Integracion**: Los use cases de otros modulos inyectan `@Inject(EMAIL_SENDER)` (fire-and-forget, try/catch):
- `RegisterUseCase` → email bienvenida
- `CreateOrderUseCase` → email confirmacion de pedido
- `ProcessPaymentNotificationUseCase` → email pago confirmado
- `CreateShipmentUseCase` → email pedido enviado con tracking URL
- `UpdateShipmentUseCase` (delivered) → email pedido entregado + invitacion a review
- `ForgotPasswordUseCase` → email password reset con token

---

## Phase 14: Reviews

**Skill**: `/ecommerce-api-generator reviews`

```
src/modules/reviews/
  reviews.module.ts
  domain/
    entities/review.entity.ts
    interfaces/review-repository.interface.ts
  infrastructure/
    orm-entities/review.orm-entity.ts
    repositories/review.repository.ts
    mappers/review.mapper.ts
  application/
    dtos/create-review.dto.ts, review-response.dto.ts
    use-cases/create-review.use-case.ts, list-product-reviews.use-case.ts
    use-cases/admin-list-pending-reviews.use-case.ts, approve-review.use-case.ts, delete-review.use-case.ts
  presentation/reviews.controller.ts, admin-reviews.controller.ts
```

**Migration**: `pnpm migration:generate src/migrations/CreateReviews`

---

## Phase 15: Admin Dashboard

**Skill**: `/ecommerce-api-generator admin`

**Pattern**: Orchestration-only (no entities, composes other modules)

```
src/modules/admin/
  admin.module.ts
  application/
    dtos/dashboard-response.dto.ts, sales-report-query.dto.ts, sales-report-response.dto.ts
    use-cases/get-dashboard.use-case.ts, get-sales-report.use-case.ts, get-top-products.use-case.ts
  presentation/admin-dashboard.controller.ts
```

**Imports**: CustomersModule, StaffModule, OrdersModule, ProductsModule (accede via repository tokens exportados)

---

## Phase 16: Search (Elasticsearch)

**Skill**: `/ecommerce-api-generator search`

```
src/modules/search/
  search.module.ts                           # Full DDD (exporta PRODUCT_SEARCH_SYNC para ProductsModule)
  domain/
    interfaces/product-search.interface.ts   # IProductSearchService + PRODUCT_SEARCH token
  infrastructure/
    services/elasticsearch-product-search.ts # implements IProductSearchService
    services/elasticsearch-product-sync.ts   # implements IProductSearchSync (defined in ProductsModule)
  application/
    dtos/search-query.dto.ts, search-suggest-query.dto.ts
    use-cases/search-products.use-case.ts, suggest-products.use-case.ts
    use-cases/reindex-products.use-case.ts   # admin: rebuild completo del indice
  presentation/search.controller.ts, admin-search.controller.ts
```

**Imports**: `forwardRef(() => ProductsModule)` (usa `PRODUCT_REPOSITORY` para reindex y fallback)

**Exports**: `PRODUCT_SEARCH_SYNC` token (implementacion real con Elasticsearch). ProductsModule importa SearchModule cuando este existe (Phase 16+) para resolver `@Optional() @Inject(PRODUCT_SEARCH_SYNC)` en sus use cases.

**Nota NestJS**: NO usar patron de @Global override — en NestJS providers locales siempre ganan sobre providers globales. En su lugar, Products usa `@Optional()` y SearchModule se importa directamente cuando existe.

**Setup**: Crear indice `products` en Elasticsearch con mapping spanish analyzer + search_as_you_type + fuzzy.

**Sync (sin dependencia circular)**:
- `IProductSearchSync` + `PRODUCT_SEARCH_SYNC` token definidos en `ProductsModule/domain/interfaces/`
- `SearchModule` implementa con `ElasticsearchProductSync` y exporta el token
- Products use cases inyectan `PRODUCT_SEARCH_SYNC` sin importar SearchModule
- Esto rompe la dependencia circular: Products → interface ← Search

**Fallback**: Si ES no esta disponible, `search-products.use-case.ts` cae a query PostgreSQL con `pg_trgm`.

---

## Phase 17: Final

### 17.1 Migration inicial
```bash
# Si no se generaron por fase, generar todo junto:
pnpm migration:generate src/migrations/InitialSchema

# Seed super admin staff:
pnpm migration:create src/migrations/SeedSuperAdminStaff
```

### 17.2 Update app.module.ts
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 1500 }]),
    ScheduleModule.forRoot(),
    ElasticsearchModule.registerAsync({ ... }),
    TypeOrmModule.forRootAsync({ ... }),
    SharedModule,           // @Global
    UploadsModule,          // @Global
    NotificationsModule,    // @Global
    AuthModule,
    CustomersModule,
    StaffModule,
    CategoriesModule,
    ProductsModule,
    BannersModule,
    CartModule,
    AddressesModule,
    WishlistModule,
    CouponsModule,
    PaymentsModule,
    OrdersModule,           // imports PaymentsModule for IPaymentProvider
    ShippingModule,
    ReviewsModule,
    AdminModule,
    SearchModule,           // ProductsModule lo importa para PRODUCT_SEARCH_SYNC (NO @Global)
  ],
  providers: [
    // GlobalExceptionFilter via DI (soporta injection de Logger, etc)
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    // Guard chain: Throttle → Auth → SubjectType → StaffRole
    JwtAuthGuard,
    SubjectTypeGuard,
    StaffRoleGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: SubjectTypeGuard },
    { provide: APP_GUARD, useExisting: StaffRoleGuard },
  ],
})
export class AppModule {}
```

### 17.3 main.ts
```typescript
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true }); // rawBody para webhook HMAC
  const config = app.get(ConfigService);

  // Validar secrets criticos al arrancar
  const jwtSecret = config.getOrThrow('JWT_SECRET');
  if (jwtSecret.length < 32 || jwtSecret.includes('CHANGE-ME')) {
    throw new Error('JWT_SECRET must be at least 32 characters and not a placeholder');
  }
  config.getOrThrow('MERCADOPAGO_ACCESS_TOKEN');
  config.getOrThrow('MERCADOPAGO_WEBHOOK_SECRET');
  config.getOrThrow('DB_PASSWORD');

  app.use(helmet());
  app.use(bodyParser.json({ limit: '1mb' })); // body size limit
  app.enableCors({ origin: config.get('FRONTEND_URL'), credentials: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => {
      const messages = errors.flatMap(e => Object.values(e.constraints || {}));
      throw new BadRequestException(messages); // GlobalExceptionFilter wraps in BaseResponse
    },
  }));
  // GlobalExceptionFilter registrado via APP_FILTER en AppModule para soportar DI

  await app.listen(config.get('PORT', 3000));
}
bootstrap();
```

### 17.4 ErrorMessages update
Agregar a `error-messages.ts` los mensajes de los nuevos modulos:
```typescript
// Auth
INVALID_CREDENTIALS: 'Invalid credentials',
EMAIL_ALREADY_EXISTS: 'Email already registered',
INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
REFRESH_TOKEN_REUSED: 'Refresh token reuse detected, all sessions revoked',
INVALID_RESET_TOKEN: 'Invalid or expired password reset token',
// Customers
CUSTOMER_NOT_FOUND: 'Customer not found',
CUSTOMER_SUSPENDED: 'Customer account is suspended',
WRONG_PASSWORD: 'Current password is incorrect',
// Categories
CATEGORY_NOT_FOUND: 'Category not found',
CATEGORY_HAS_PRODUCTS: 'Cannot delete category with products',
CATEGORY_HAS_SUBCATEGORIES: 'Cannot delete category with subcategories',
// Products
PRODUCT_NOT_FOUND: 'Product not found',
INSUFFICIENT_STOCK: 'Insufficient stock',
// Banners
BANNER_NOT_FOUND: 'Banner not found',
// Cart
CART_EMPTY: 'Cart is empty',
CART_ITEM_NOT_FOUND: 'Cart item not found',
// Wishlist
WISHLIST_ITEM_ALREADY_EXISTS: 'Product already in wishlist',
WISHLIST_ITEM_NOT_FOUND: 'Product not in wishlist',
// Coupons
COUPON_NOT_FOUND: 'Coupon not found',
COUPON_EXPIRED: 'Coupon has expired',
COUPON_LIMIT_REACHED: 'Coupon usage limit reached',
COUPON_USER_LIMIT_REACHED: 'You have already used this coupon',
COUPON_MIN_PURCHASE: 'Minimum purchase amount not reached',
COUPON_INACTIVE: 'Coupon is not active',
// Orders
ORDER_NOT_FOUND: 'Order not found',
ORDER_CANNOT_CANCEL: 'Order can only be cancelled while pending',
ORDER_EXPIRED: 'Order expired due to unpaid status',
ORDER_INVALID_TRANSITION: 'Invalid order status transition',
// Payments
PAYMENT_ALREADY_PROCESSED: 'Payment has already been processed',
PAYMENT_VERIFICATION_FAILED: 'Could not verify payment status',
PAYMENT_NOT_FOUND: 'Payment not found',
PAYMENT_INVALID_SIGNATURE: 'Invalid webhook signature',
PAYMENT_AMOUNT_MISMATCH: 'Payment amount does not match order total',
ORDER_NOT_PENDING_PAYMENT: 'Order is not pending payment',
// Shipping
SHIPMENT_NOT_FOUND: 'Shipment not found',
SHIPMENT_ALREADY_EXISTS: 'Order already has a shipment',
// Reviews
REVIEW_NOT_FOUND: 'Review not found',
REVIEW_ALREADY_EXISTS: 'You already reviewed this product',
REVIEW_NOT_PURCHASED: 'You can only review products you have purchased',
// Addresses
ADDRESS_NOT_FOUND: 'Address not found',
ADDRESS_NOT_OWNED: 'Address does not belong to this user',
ADDRESS_LIMIT_REACHED: 'Maximum of 10 addresses per user reached',
// Uniqueness violations
SLUG_ALREADY_EXISTS: 'Slug already exists',
SKU_ALREADY_EXISTS: 'SKU already exists',
COUPON_CODE_ALREADY_EXISTS: 'Coupon code already exists',
// Uploads
UPLOAD_FAILED: 'Image upload failed',
UPLOAD_INVALID_FORMAT: 'Invalid image format. Allowed: jpg, png, webp',
UPLOAD_TOO_LARGE: 'Image exceeds maximum size of 5MB',
// Invoicing
INVOICE_ALREADY_EXISTS: 'Invoice already exists for this order',
INVOICE_ORDER_NOT_PAID: 'Cannot generate invoice for unpaid order',
INVOICE_FACTURA_REQUIRES_RUC: 'Factura requires RUC document',
INVOICE_CANCEL_EXPIRED: 'Invoice can only be cancelled within 72 hours',
INVOICE_NOT_FOUND: 'Invoice not found',
// Staff
STAFF_NOT_FOUND: 'Staff member not found',
STAFF_SUSPENDED: 'Staff account is suspended',
STAFF_EMAIL_ALREADY_EXISTS: 'A staff member with this email already exists',
STAFF_CANNOT_CHANGE_OWN_ROLE: 'Cannot change your own role',
STAFF_CANNOT_SUSPEND_SELF: 'Cannot suspend yourself',
STAFF_LAST_SUPER_ADMIN: 'Cannot remove the last active super admin',
STAFF_INSUFFICIENT_ROLE: 'Insufficient role to perform this action',
// Invitations
INVITATION_NOT_FOUND: 'Invitation not found',
INVITATION_EXPIRED: 'Invitation has expired',
INVITATION_ALREADY_ACCEPTED: 'Invitation has already been accepted',
INVITATION_REVOKED: 'Invitation has been revoked',
INVITATION_EMAIL_EXISTS: 'A staff member with this email already exists',
INVITATION_CANNOT_INVITE_ROLE: 'You cannot invite staff with this role',
// POS (expanded)
POS_CASH_REGISTER_ALREADY_OPEN: 'You already have an open cash register',
POS_CASH_REGISTER_NOT_OPEN: 'No open cash register found',
POS_CASH_REGISTER_NOT_FOUND: 'Cash register not found',
POS_ORDER_NOT_POS: 'This order is not a POS/WhatsApp order',
POS_ORDER_CANNOT_CANCEL: 'Only paid POS orders can be cancelled',
POS_ORDER_CANNOT_REFUND: 'Only paid or processing POS orders can be refunded',
POS_REFUND_QUANTITY_EXCEEDED: 'Refund quantity exceeds purchased quantity',
POS_ITEMS_EMPTY: 'At least one item is required',
POS_INVALID_DOC_NUMBER: 'Invalid document number for the specified type',
```

### 17.5 Health check
```typescript
// src/health/health.controller.ts
@Controller('health')
@Public()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private elasticsearch: ElasticsearchHealthIndicator,
  ) {}

  @Get()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.elasticsearch.pingCheck('elasticsearch'),
    ]);
  }
}
```

### 17.6 Seed data
```bash
# Seed super admin staff
pnpm migration:create src/migrations/SeedSuperAdminStaff

# Seed initial categories (opcional)
pnpm migration:create src/migrations/SeedDefaultCategories
```
The seed migration inserts into `staff_members` table with role `super_admin`, NOT into a `users` table.

### 17.7 Tests
- Unit tests para cada domain entity
- Unit tests para cada use case (con mock repositories)
- E2E tests para flujos criticos:
  - Auth: register → login → refresh → me
  - Shopping: add to cart → checkout → payment webhook → verify order paid
  - Admin: create product → create order → ship → deliver
  - Expiration: create order → wait → verify cancelled + stock restored

### 17.8 Build check
```bash
docker compose up -d
pnpm run build
pnpm run test
pnpm run test:e2e
```

---

## Phase 18: POS (Point of Sale)

**Dependencias**: Phase 10 (Orders), Phase 4 (Products), Phase 9 (Coupons)
**Spec**: `docs/modules/pos.md`

### 18.1 Enums (en Orders domain)
```
src/modules/orders/domain/enums/
  order-channel.enum.ts        # ONLINE = 'online', POS = 'pos', WHATSAPP = 'whatsapp'
  payment-method.enum.ts       # MERCADOPAGO = 'mercadopago', CASH = 'cash', YAPE_PLIN = 'yape_plin', BANK_TRANSFER = 'bank_transfer'
  customer-doc-type.enum.ts    # DNI = 'dni', RUC = 'ruc'
```

### 18.2 Update Order entity
- Agregar campos: `channel`, `paymentMethod`, `customerDocType`, `customerDocNumber`
- Hacer `shippingAddressSnapshot` nullable
- Actualizar `Order.create()` y `Order.reconstitute()` con nuevos campos
- Actualizar `OrderMapper` con nuevos campos
- Actualizar ORM entity con columnas nuevas

### 18.3 POS module (Full DDD)
```
src/modules/pos/
  pos.module.ts
  domain/
    entities/cash-register.entity.ts, cash-movement.entity.ts
    enums/cash-movement-type.enum.ts       # OPEN = 'open', SALE = 'sale', REFUND = 'refund', MANUAL_IN = 'manual_in', MANUAL_OUT = 'manual_out', CLOSE = 'close'
    interfaces/cash-register-repository.interface.ts, cash-movement-repository.interface.ts
  infrastructure/
    orm-entities/cash-register.orm-entity.ts, cash-movement.orm-entity.ts
    repositories/cash-register.repository.ts, cash-movement.repository.ts
    mappers/cash-register.mapper.ts, cash-movement.mapper.ts
  application/
    use-cases/
      create-pos-order.use-case.ts
      list-pos-orders.use-case.ts
      get-pos-order.use-case.ts
      cancel-pos-order.use-case.ts
      refund-pos-order.use-case.ts
      open-cash-register.use-case.ts
      close-cash-register.use-case.ts
      get-cash-register.use-case.ts
      add-cash-movement.use-case.ts
      get-pos-daily-report.use-case.ts
      get-pos-sales-summary.use-case.ts
    dtos/
      create-pos-order.dto.ts
      pos-order-filters.dto.ts
      pos-order-response.dto.ts
      open-cash-register.dto.ts
      close-cash-register.dto.ts
      cash-movement.dto.ts
      cash-register-response.dto.ts
      pos-report-response.dto.ts
  presentation/
    pos.controller.ts            # /admin/pos/orders
    pos-cash-register.controller.ts  # /admin/pos/cash-registers
    pos-reports.controller.ts    # /admin/pos/reports
```

### 18.4 Migration
```bash
pnpm migration:generate src/migrations/AddOrderChannelAndPos
# Agrega: channel, payment_method, customer_doc_type, customer_doc_number
# Modifica: shipping_address_snapshot nullable
# Agrega: CHECK constraints para channel, payment_method, online_address
# Default: channel='online', payment_method='mercadopago' (para ordenes existentes)

pnpm migration:generate src/migrations/CreateCashRegistersAndMovements
# Crea tabla cash_registers: id, staff_member_id, opened_at, closed_at, opening_amount, closing_amount, expected_amount, difference, notes
# Crea tabla cash_movements: id, cash_register_id, type, amount, order_id (nullable), notes, created_at
# FK indexes + CHECK constraints
```

### 18.5 app.module.ts
```typescript
PosModule,  // agregar despues de AdminModule
```

### 18.6 Tests
- Unit: `CreatePosOrderUseCase` (flujo POS y WhatsApp)
- Unit: Verificar que POS orders van directo a `paid`
- Unit: Verificar que WhatsApp con delivery requiere address
- Unit: `OpenCashRegisterUseCase` / `CloseCashRegisterUseCase`
- Unit: `CancelPosOrderUseCase` y `RefundPosOrderUseCase`
- E2E: `POST /admin/pos/orders` con cash → status paid
- E2E: Open cash register → create POS order → close cash register → verify report

---

## Phase 19: Invoicing (SUNAT)

**Dependencias**: Phase 18 (POS), Phase 10 (Orders)
**Spec**: `docs/modules/invoicing.md`

### 19.1 Domain
```
src/modules/invoicing/
  domain/
    entities/
      invoice.entity.ts
    enums/
      invoice-type.enum.ts        # BOLETA = 'boleta', FACTURA = 'factura'
      sunat-status.enum.ts        # PENDING = 'pending', ACCEPTED = 'accepted', REJECTED = 'rejected', CANCELLED = 'cancelled'
    interfaces/
      invoice-provider.interface.ts   # IInvoiceProvider + INVOICE_PROVIDER token
      invoice-repository.interface.ts # IInvoiceRepository + INVOICE_REPOSITORY token
```

### 19.2 Infrastructure
```
  infrastructure/
    orm-entities/
      invoice.orm-entity.ts
    repositories/
      typeorm-invoice.repository.ts
    mappers/
      invoice.mapper.ts
    services/
      nubefact-invoice.provider.ts    # Implementa IInvoiceProvider
```

### 19.3 Application
```
  application/
    use-cases/
      create-invoice.use-case.ts
      get-invoice.use-case.ts
      cancel-invoice.use-case.ts
      list-invoices.use-case.ts
    dtos/
      create-invoice.dto.ts
      invoice-response.dto.ts
      invoice-filters.dto.ts
```

### 19.4 Presentation
```
  presentation/
    invoice.controller.ts     # /admin/orders/:id/invoice, /admin/invoices
```

### 19.5 Module
```typescript
// invoicing.module.ts — @Global para que POS pueda inyectar IInvoiceProvider
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([InvoiceOrmEntity])],
  providers: [
    { provide: INVOICE_REPOSITORY, useClass: TypeOrmInvoiceRepository },
    { provide: INVOICE_PROVIDER, useClass: NubefactInvoiceProvider },
    CreateInvoiceUseCase,
    GetInvoiceUseCase,
    CancelInvoiceUseCase,
    ListInvoicesUseCase,
  ],
  controllers: [InvoiceController],
  exports: [INVOICE_PROVIDER, INVOICE_REPOSITORY],
})
```

### 19.6 Migration
```bash
pnpm migration:generate src/migrations/AddInvoices
# Crea tabla invoices con todos los campos
# Agrega: UNIQUE (order_id), FK index, CHECK constraints
```

### 19.7 app.module.ts
```typescript
InvoicingModule,  // @Global, agregar despues de NotificationsModule
```

### 19.8 Env vars
```env
NUBEFACT_API_TOKEN=your-api-token
NUBEFACT_API_URL=https://api.nubefact.com/api/v1
NUBEFACT_RUC=your-ruc
NUBEFACT_BUSINESS_NAME=your-business-name
```

### 19.9 Tests
- Unit: `CreateInvoiceUseCase` (boleta con DNI, factura con RUC)
- Unit: Validar que factura requiere RUC
- Unit: Validar que no se puede facturar orden no pagada
- Unit: IGV calculation (18%)
- E2E: `POST /admin/orders/:id/invoice` → genera boleta

---

## Phase 20: Final (Updated)

Misma estructura que Phase 17 original pero incluye los nuevos modulos:

### 20.1 Update app.module.ts final
```typescript
@Module({
  imports: [
    // ... (misma config que Phase 17.2)
    PosModule,
    InvoicingModule,       // @Global
  ],
  // ... (mismos providers)
})
```

### 20.2 Update seed data
- Seed admin user (existente)
- Seed categories (existente)
- Seed sample products (existente)

### 20.3 Update E2E tests
Agregar flujo POS:
- Admin: create POS order (cash) → verify status paid → generate boleta
- Admin: create WhatsApp order con delivery → verify address snapshot
- Admin: create factura con RUC → verify SUNAT status

### 20.4 Build check final
```bash
docker compose up -d
pnpm run build
pnpm run test
pnpm run test:e2e
```

---

## Execution Strategy

Cada fase se ejecuta asi:
1. Invocar `/ecommerce-api-generator [module]` con el contexto de CONTEXT.md
2. Generar archivos en orden (domain → infra → app → presentation → module)
3. Registrar en `app.module.ts`
4. Generar migracion: `pnpm migration:generate src/migrations/{Name}`
5. `pnpm run build` para verificar compilacion
6. Commit por fase

**Estimacion**: ~110-135 archivos de codigo, ~17-20 migraciones, ~22 modulos.

**Infraestructura local**: PostgreSQL + Elasticsearch + Kibana via Docker Compose.
