# Ecommerce GMI2 — Global Context

## Overview

API REST para un ecommerce generico y completo orientado a un vendedor minorista en Peru. Incluye storefront (cliente) y backoffice (admin). Pagos con MercadoPago Checkout Pro. Envios con tracking de carriers externos (Shalom, SerPost, Olva, etc).

**Stack**: NestJS 11 + TypeScript + PostgreSQL + TypeORM + JWT + MercadoPago + Elasticsearch + Kibana + Cloudinary

**Prefix**: `api/v1`

**Moneda**: Todos los precios en centavos de PEN (Soles peruanos). El VO `Money` almacena `amount` (integer, centavos) con currency fijo `PEN`.

---

## Roles

### Customer (ecommerce)
Navegar catalogo, carrito, wishlist, checkout, pagar, ver ordenes, reviews, gestionar perfil/direcciones.

### Staff (backoffice) — 3 niveles

| StaffRole | Alcance |
|-----------|---------|
| **super_admin** | Todo: invitar cualquier staff, gestionar roles, POS, dashboard, CRUD total, facturacion |
| **admin** | POS, gestionar productos/categorias/ordenes/clientes/envios, invitar UserStaff, dashboard, facturacion |
| **user** | Ver ordenes, gestionar envios, operaciones basicas, dashboard (solo lectura) |

**Guard chain**: ThrottlerGuard → JwtAuthGuard → SubjectTypeGuard → StaffRoleGuard
**SubjectType enum**: `CUSTOMER` / `STAFF` (en JWT payload)
**StaffRole enum**: `SUPER_ADMIN` / `ADMIN` / `USER` (en JWT payload para staff)

---

## Modules (22)

| # | Module | Tipo | Archivo |
|---|--------|------|---------|
| 1 | Shared | @Global | [shared.md](modules/shared.md) |
| 2 | Auth | Full DDD | [auth.md](modules/auth.md) |
| 3 | Customers | Full DDD | [customers.md](modules/customers.md) |
| 4 | Staff | Full DDD | [staff.md](modules/staff.md) |
| 5 | Categories | Full DDD | [categories.md](modules/categories.md) |
| 6 | Products | Full DDD | [products.md](modules/products.md) |
| 7 | Banners | Full DDD | [banners.md](modules/banners.md) |
| 8 | Cart | Full DDD | [cart.md](modules/cart.md) |
| 9 | Addresses | Full DDD | [addresses.md](modules/addresses.md) |
| 10 | Coupons | Full DDD | [coupons.md](modules/coupons.md) |
| 11 | Orders | Full DDD | [orders.md](modules/orders.md) |
| 12 | Payments | Full DDD | [payments.md](modules/payments.md) |
| 13 | Shipping | Full DDD | [shipping.md](modules/shipping.md) |
| 14 | Reviews | Full DDD | [reviews.md](modules/reviews.md) |
| 15 | Admin | Orchestration | [admin.md](modules/admin.md) |
| 16 | Wishlist | Full DDD | [wishlist.md](modules/wishlist.md) |
| 17 | Uploads | Full DDD | [uploads.md](modules/uploads.md) |
| 18 | Notifications | @Global Infrastructure | [notifications.md](modules/notifications.md) |
| 19 | Logging | Middleware en Shared | [logging.md](modules/logging.md) |
| 20 | Search | Full DDD | [search.md](modules/search.md) |
| 21 | POS | Orchestration | [pos.md](modules/pos.md) |
| 22 | Invoicing | @Global Infrastructure | [invoicing.md](modules/invoicing.md) |

---

## Database Schema (Entity Relationships)

```
customers ─────┬──── refresh_tokens (subjectType: customer)
               ├──── addresses
               ├──── wishlist_items ──── products
               ├──── carts ──── cart_items ──── products
               ├──── orders (channel: online) ─┬── order_items ──── products
               │                               ├── order_events
               │                               ├── payments
               │                               ├── shipments
               │                               └── invoices
               └──── reviews ──── products

staff_members ─┬──── refresh_tokens (subjectType: staff)
               ├──── staff_invitations
               ├──── orders (channel: pos/whatsapp) ──── (same children as above)
               └──── cash_registers ──── cash_movements

categories ──── products (many-to-one)
categories ──── categories (self-ref parent)
coupons ──── orders (optional FK)
banners (standalone)
order_number_counters (standalone, daily reset)

Elasticsearch indices: products (search), ecommerce-logs-* (logging)
```

---

## Flujos Principales

### Customer: Compra completa
```
1. GET /search?q=zapatos (busqueda inteligente con fuzzy match)
2. GET /products/:slug (ver detalle)
3. POST /wishlist/:productId (guardar para despues, opcional)
4. POST /cart/items (agregar al carrito)
5. POST /coupons/validate (opcional)
6. POST /orders (checkout → crea orden + preferencia MercadoPago)
7. Redirect a MercadoPago (pago)
8. Webhook IPN → Payment approved → Order status: paid → Email confirmacion
   (fallback: POST /orders/:id/verify-payment si webhook no llego)
9. Staff: POST /admin/orders/:id/shipment (registra envio) → Email con tracking
10. Customer: GET /orders/:id (ve tracking URL del carrier)
11. Staff: PATCH shipment → delivered → Email pedido entregado
12. Customer: POST /products/:id/reviews (deja review)
* Si no paga en 2h: cron expira orden → restaura stock
```

### Staff: Gestion diaria (backoffice)
```
1. GET /admin/dashboard (ver resumen)
2. GET /admin/orders?status=paid (ordenes pagadas pendientes de envio)
3. POST /admin/orders/:id/shipment (registrar tracking)
4. PATCH /admin/orders/:id/status → processing/shipped
5. GET /admin/reviews (aprobar reviews pendientes)
6. CRUD /admin/products, /admin/categories, /admin/banners, /admin/coupons
```

### Staff (Admin/SuperAdmin): Venta POS / WhatsApp
```
1. POST /admin/pos/orders (seleccionar productos + cantidades + metodo pago)
   - channel: 'pos' (presencial) o 'whatsapp'
   - paymentMethod: cash, yape_plin, bank_transfer
   - Status va directo a 'paid'
2. POST /admin/orders/:id/invoice (generar boleta/factura SUNAT, opcional)
3. Si WhatsApp con delivery: incluir addressId para envio
4. POST /admin/pos/cash-register/open (abrir caja al inicio del dia)
5. POST /admin/pos/orders/:id/cancel (anular venta si es necesario)
6. POST /admin/pos/cash-register/close (cerrar caja al final del dia)
```

---

## Database Constraints & Indexes

### FK Indexes (TypeORM NO los crea automaticamente)
Cada FK necesita un index explicito en la migracion:
```sql
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);  -- userId references customers or staff_members
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_events_order_id ON order_events(order_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_external_id ON payments(external_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id) WHERE is_approved = true;
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items(product_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_product_id_fk ON reviews(product_id);  -- non-partial, for FK CASCADE operations (the partial index above only covers approved)
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_staff_invitations_invited_by ON staff_invitations(invited_by);
CREATE INDEX idx_cash_registers_staff_id ON cash_registers(staff_id);
CREATE INDEX idx_cash_movements_cash_register_id ON cash_movements(cash_register_id);
-- Nota: cart_items.cart_id y wishlist_items.user_id estan cubiertos por sus UNIQUE constraints compositos (leading column)
-- Nota: carts.user_id esta cubierto por UNIQUE constraint
-- Nota: idx_payments_external_id es redundante con uq_payments_external_id — omitir el index explicito
```

### Business Indexes
```sql
CREATE INDEX idx_orders_pending_created ON orders(created_at) WHERE status = 'pending';
CREATE INDEX idx_orders_channel ON orders(channel) WHERE channel != 'online';
CREATE INDEX idx_orders_user_coupon ON orders(user_id, coupon_id) WHERE coupon_id IS NOT NULL;
CREATE INDEX idx_products_active_category ON products(is_active, category_id, price);
CREATE INDEX idx_banners_active ON banners(position, sort_order) WHERE is_active = true;
CREATE INDEX idx_refresh_tokens_active ON refresh_tokens(user_id) WHERE is_revoked = false;
CREATE INDEX idx_cash_registers_open ON cash_registers(staff_id) WHERE status = 'open';
CREATE INDEX idx_staff_invitations_pending ON staff_invitations(email) WHERE accepted_at IS NULL AND is_revoked = false;
```

### Unique Constraints
```sql
ALTER TABLE cart_items ADD CONSTRAINT uq_cart_items_cart_product UNIQUE (cart_id, product_id);
ALTER TABLE reviews ADD CONSTRAINT uq_reviews_user_product UNIQUE (user_id, product_id);
ALTER TABLE wishlist_items ADD CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id);
ALTER TABLE payments ADD CONSTRAINT uq_payments_external_id UNIQUE (external_id);
ALTER TABLE orders ADD CONSTRAINT uq_orders_order_number UNIQUE (order_number);
ALTER TABLE carts ADD CONSTRAINT uq_carts_user_id UNIQUE (user_id);
ALTER TABLE shipments ADD CONSTRAINT uq_shipments_order_id UNIQUE (order_id);
ALTER TABLE invoices ADD CONSTRAINT uq_invoices_order_id UNIQUE (order_id);
ALTER TABLE staff_invitations ADD CONSTRAINT uq_staff_invitations_token_hash UNIQUE (token_hash);
```

### CHECK Constraints
```sql
ALTER TABLE products ADD CONSTRAINT chk_products_price CHECK (price > 0);
ALTER TABLE products ADD CONSTRAINT chk_products_stock CHECK (stock >= 0);
ALTER TABLE products ADD CONSTRAINT chk_products_compare_price CHECK (compare_at_price IS NULL OR compare_at_price > price);
ALTER TABLE products ADD CONSTRAINT chk_products_images CHECK (images IS NULL OR jsonb_typeof(images) = 'array');
ALTER TABLE order_items ADD CONSTRAINT chk_order_items_quantity CHECK (quantity > 0);
ALTER TABLE order_items ADD CONSTRAINT chk_order_items_unit_price CHECK (unit_price > 0);
ALTER TABLE cart_items ADD CONSTRAINT chk_cart_items_quantity CHECK (quantity >= 1);
ALTER TABLE coupons ADD CONSTRAINT chk_coupons_value CHECK (value > 0);
ALTER TABLE coupons ADD CONSTRAINT chk_coupons_dates CHECK (start_date < end_date);
ALTER TABLE reviews ADD CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE orders ADD CONSTRAINT chk_orders_totals CHECK (subtotal >= 0 AND total >= 0 AND discount >= 0);
ALTER TABLE orders ADD CONSTRAINT chk_orders_shipping_address CHECK (
  shipping_address_snapshot IS NULL OR (
    shipping_address_snapshot ? 'street' AND shipping_address_snapshot ? 'city'
    AND shipping_address_snapshot ? 'department' AND shipping_address_snapshot ? 'recipientName'
  )
);
-- shipping_address_snapshot es nullable (POS en tienda no necesita direccion, WhatsApp con delivery si)
ALTER TABLE orders ADD CONSTRAINT chk_orders_channel CHECK (channel IN ('online', 'pos', 'whatsapp'));
ALTER TABLE orders ADD CONSTRAINT chk_orders_payment_method CHECK (payment_method IN ('mercadopago', 'cash', 'yape_plin', 'bank_transfer'));
ALTER TABLE orders ADD CONSTRAINT chk_orders_online_address CHECK (channel != 'online' OR shipping_address_snapshot IS NOT NULL);
-- Ordenes online siempre requieren direccion de envio
ALTER TABLE payments ADD CONSTRAINT chk_payments_amount CHECK (amount > 0);
ALTER TABLE products ADD CONSTRAINT chk_products_avg_rating CHECK (average_rating >= 0 AND average_rating <= 5);
ALTER TABLE products ADD CONSTRAINT chk_products_total_reviews CHECK (total_reviews >= 0);
ALTER TABLE orders ADD CONSTRAINT chk_orders_shipping_cost CHECK (shipping_cost >= 0);
ALTER TABLE coupons ADD CONSTRAINT chk_coupons_current_uses CHECK (current_uses >= 0);
ALTER TABLE coupons ADD CONSTRAINT chk_coupons_min_purchase CHECK (min_purchase IS NULL OR min_purchase >= 0);
ALTER TABLE coupons ADD CONSTRAINT chk_coupons_max_discount CHECK (max_discount IS NULL OR max_discount > 0);
ALTER TABLE coupons ADD CONSTRAINT chk_coupons_max_uses CHECK (max_uses IS NULL OR max_uses > 0);
ALTER TABLE coupons ADD CONSTRAINT chk_coupons_percentage CHECK (type != 'percentage' OR (value >= 1 AND value <= 100));
ALTER TABLE banners ADD CONSTRAINT chk_banners_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date < end_date);
ALTER TABLE cash_registers ADD CONSTRAINT chk_cash_registers_initial_amount CHECK (initial_amount >= 0);
ALTER TABLE cash_movements ADD CONSTRAINT chk_cash_movements_amount CHECK (amount > 0);
ALTER TABLE staff_members ADD CONSTRAINT chk_staff_members_role CHECK (role IN ('super_admin', 'admin', 'user'));
```

### ON DELETE Behavior
```sql
-- CASCADE (datos efimeros/dependientes)
order_items.order_id → CASCADE
order_events.order_id → CASCADE
cart_items.cart_id → CASCADE
wishlist_items.user_id → CASCADE
refresh_tokens.user_id → CASCADE  -- userId puede ser customer o staff

-- RESTRICT (datos criticos)
orders.user_id → RESTRICT  -- puede ser customer_id o staff_id segun channel
payments.order_id → RESTRICT
shipments.order_id → RESTRICT
reviews.user_id → RESTRICT
products.category_id → RESTRICT (app valida CATEGORY_HAS_PRODUCTS)
order_items.product_id → RESTRICT (snapshot existe, referencia debe preservarse)

-- SET NULL
orders.coupon_id → SET NULL (permite eliminar cupon, orden conserva couponCode snapshot)
order_events.performed_by → SET NULL (preserva historial si admin se elimina)
categories.parent_id → SET NULL (subcategoria se convierte en raiz si padre se elimina)

-- CASCADE (datos efimeros de producto — nota: productos usan soft-delete, hard-delete no deberia ocurrir)
cart_items.product_id → CASCADE
wishlist_items.product_id → CASCADE
reviews.product_id → CASCADE

-- CASCADE (datos dependientes de user — carts y addresses son personales)
carts.user_id → CASCADE
addresses.user_id → CASCADE

-- RESTRICT (reviews prueban la compra)
reviews.order_id → RESTRICT

-- RESTRICT (comprobante fiscal no se puede perder)
invoices.order_id → RESTRICT

-- Staff
staff_invitations.invited_by → SET NULL (preserva historial si invitador se elimina)
cash_registers.staff_id → RESTRICT
cash_movements.cash_register_id → CASCADE
cash_movements.staff_id → SET NULL
```

### Precision de tipos
```sql
products.average_rating → NUMERIC(3, 2)  -- soporta 1.00-5.00
-- Todos los timestamps → timestamptz (no timestamp)
-- Precios → integer (centavos PEN)
```

### Connection Pool
```typescript
// En TypeOrmModule.forRootAsync:
extra: { max: 20, connectionTimeoutMillis: 5000 }
```
Suficiente para retailer pequeno. El cron de expiracion procesa cada orden en su propia transaccion (libera conexion entre ordenes).

### Extension requerida
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- para fallback de busqueda
```

---

## Validacion de DTOs (reglas globales)

- **`@MaxLength()`** en todos los campos string de DTOs de input:
  - `name`, `title`, `label`: 255
  - `description`: 5000
  - `comment`, `notes`, `adminNotes`: 2000
  - `reference`, `street`, `district`, `city`: 500
  - `couponCode`, `sku`: 50
- **Sanitizacion HTML**: Campos de texto libre (`comment`, `notes`, `reference`) se sanitizan server-side con `sanitize-html` (strip ALL tags) antes de almacenar
- **Body size limit**: `app.use(json({ limit: '1mb' }))` en `main.ts`
- **`forbidNonWhitelisted: true`** en ValidationPipe global, con override `forbidNonWhitelisted: false` en webhook controller via `@UsePipes()`

---

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_gmi2
DB_USERNAME=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=CHANGE-ME-min-32-chars
JWT_EXPIRATION=300
JWT_REFRESH_EXPIRATION=604800

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=your-access-token
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret
MERCADOPAGO_SUCCESS_URL=http://localhost:3000/payment/success
MERCADOPAGO_FAILURE_URL=http://localhost:3000/payment/failure
MERCADOPAGO_PENDING_URL=http://localhost:3000/payment/pending

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tienda@gmail.com
SMTP_PASS=app-password
EMAIL_FROM="Mi Tienda <tienda@gmail.com>"

# Orders
ORDER_EXPIRATION_HOURS=2
SHIPPING_FLAT_RATE=1500

# Invoicing (Nubefact / SUNAT)
NUBEFACT_API_TOKEN=your-api-token
NUBEFACT_API_URL=https://api.nubefact.com/api/v1
NUBEFACT_RUC=your-ruc
NUBEFACT_BUSINESS_NAME=your-business-name

# Staff
STAFF_INVITATION_EXPIRATION_HOURS=72
FRONTEND_STAFF_URL=http://localhost:3001

# App
PORT=3000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Validacion de secrets al arrancar** (en `main.ts` o `ConfigModule`):
- `JWT_SECRET`: requerido, minimo 32 caracteres, NO puede ser el placeholder
- `MERCADOPAGO_ACCESS_TOKEN`: requerido
- `MERCADOPAGO_WEBHOOK_SECRET`: requerido
- `DB_PASSWORD`: requerido
Si falta alguno, la app **no arranca** y muestra error claro.

---

## Docker Compose (desarrollo local)

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
