# 10. Orders

Ordenes de compra. Historial preciso y verificable con snapshot de datos al momento de la compra.

**Entities**: `Order`, `OrderItem`, `OrderEvent`

**Order:**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| orderNumber | string | unique, auto-generado via table-based counter (e.g. "ORD-20260414-001") — ver seccion OrderNumber |
| userId | uuid | FK → customers (online) o staff_members (POS) — ver nota |
| channel | enum | `online` / `pos` / `whatsapp` — default `online` |
| status | enum | `pending` / `paid` / `processing` / `shipped` / `delivered` / `cancelled` / `refunded` |
| paymentMethod | enum | `mercadopago` / `cash` / `yape_plin` / `bank_transfer` — default `mercadopago` |
| subtotal | integer | suma de items (centavos) |
| discount | integer | descuento aplicado (centavos), default 0 |
| shippingCost | integer | costo de envio (centavos), calculado via SHIPPING_FLAT_RATE env var (default 0) |
| total | integer | subtotal - discount + shippingCost |
| couponId | uuid? | FK → coupons (referencia) |
| couponCode | string? | snapshot del codigo aplicado |
| couponDiscount | integer? | snapshot del descuento calculado |
| shippingAddressSnapshot | jsonb? | copia completa de la direccion — nullable para ventas POS en tienda |
| customerName | string | snapshot nombre del cliente |
| customerEmail | string | snapshot email del cliente |
| customerPhone | string? | snapshot telefono |
| customerDocType | enum? | `dni` / `ruc` — para facturacion SUNAT |
| customerDocNumber | string? | numero de documento (8 digitos DNI, 11 digitos RUC) |
| notes | text? | notas del cliente |
| adminNotes | text? | notas internas del admin |

**OrderItem:**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| orderId | uuid | FK → orders |
| productId | uuid | FK → products (referencia) |
| productName | string | snapshot nombre al momento de compra |
| productSlug | string | snapshot slug |
| productImage | string? | snapshot primera imagen |
| unitPrice | integer | snapshot precio unitario (centavos) |
| quantity | integer | |
| subtotal | integer | unitPrice * quantity |

**OrderEvent (historial de estados):**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| orderId | uuid | FK → orders |
| status | enum | `pending`/`paid`/`processing`/`shipped`/`delivered`/`cancelled`/`refunded` |
| description | string | "Orden creada", "Pago confirmado", etc |
| performedBy | uuid? | FK → users (admin que hizo el cambio, null si sistema) |
| metadata | jsonb? | datos extra (payment_id, tracking, etc) |

**Endpoints — Customer:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/orders` | JWT, @Throttle(5/hora) | Crear orden desde carrito (checkout) |
| GET | `/orders` | JWT | Listar mis ordenes (paginado, filtro opcional: `status`) |
| GET | `/orders/:id` | JWT | Detalle de orden (items + eventos + envio). **Ownership**: `order.userId === currentUserId` |
| POST | `/orders/:id/cancel` | JWT | Cancelar orden (solo si pending) + restaurar stock |
| POST | `/orders/:id/retry-payment` | JWT | Reintentar creacion de preferencia MercadoPago (si la orden no tiene paymentUrl) |

**Endpoints — Admin:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/orders` | admin | Listar todas las ordenes (filtros, paginacion) |
| GET | `/admin/orders/:id` | admin | Detalle completo |
| PATCH | `/admin/orders/:id/status` | admin | Cambiar estado |
| PATCH | `/admin/orders/:id/notes` | admin | Agregar notas internas |

**Filtros admin**: `status`, `userId`, `dateFrom`, `dateTo`, `search` (orderNumber), `sortBy`

**Use Cases**: `CreateOrderUseCase`, `ListMyOrdersUseCase`, `GetOrderUseCase`, `CancelOrderUseCase`, `RetryPaymentUseCase`, `ProcessPaymentNotificationUseCase`, `VerifyPaymentUseCase`, `ExpireUnpaidOrdersUseCase`, `AdminListOrdersUseCase`, `AdminGetOrderUseCase`, `UpdateOrderStatusUseCase`, `UpdateOrderNotesUseCase`

**CreateOrderDto:**
```
addressId: uuid (required) — debe pertenecer al usuario
couponCode: string (optional)
notes: string (optional)
```

**Flujo de checkout (dentro de transaccion DB):**
```
BEGIN TRANSACTION
  1. Validar carrito no vacio
  2. Validar que addressId pertenece al usuario
  3. Lock cupon con SELECT FOR UPDATE (si aplica)
  4. Validar cupon (fechas, usos, minPurchase, uso por usuario)
  5. Validar stock de cada item
  6. Snapshot: copiar datos de productos, direccion, cliente
  7. Calcular totales (subtotal, descuento, shippingCost via SHIPPING_FLAT_RATE, total)
  8. Generar orderNumber via table-based counter (atomico, sin gaps, reset diario)
  9. Crear orden + items + evento "Orden creada"
  10. Descontar stock con query atomica (ver abajo)
  11. Incrementar currentUses del cupon (query atomica)
  12. Vaciar carrito
COMMIT

13. Crear preferencia MercadoPago via IPaymentProvider.createPreference() (fuera de transaccion)
    - Si falla: la orden queda en status `pending` sin paymentUrl
    - El frontend puede reintentar via POST /orders/:id/retry-payment
14. Retornar orden con URL de pago + enviar email confirmacion (fire-and-forget)
```

> **Importante**: Pasos 1-12 dentro de `unitOfWork.execute(async (ctx) => { ... })`. `ctx` es `TransactionContext` (opaco). Cada repositorio se usa via `repo.withTransaction(ctx)` para operar en la misma transaccion. Si cualquiera falla, rollback completo. El paso 13 (llamada a API externa) esta fuera de la transaccion para no bloquear la DB.

**Stock atomico (race condition prevention):**
```sql
UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty
```
Si `affectedRows = 0` → throw `DomainException(ErrorMessages.INSUFFICIENT_STOCK)`. Esto previene que dos compradores simultaneos compren el ultimo item.

**Cancelacion manual (`CancelOrderUseCase`):**
Dentro de `unitOfWork.execute(async (ctx) => { ... })`:
1. Verificar `order.userId === authenticatedUserId` (ownership)
2. **Transicion atomica primero**: `UPDATE orders SET status = 'cancelled' WHERE id = :id AND status = 'pending'`. Si `affectedRows = 0` → throw (ya fue pagada/cancelada). Esto previene race condition con webhook.
3. Restaurar stock de cada item — **ordenar items por productId ASC** antes de actualizar (previene deadlocks): `UPDATE products SET stock = stock + :qty WHERE id = :productId`
4. Si habia cupon: `UPDATE coupons SET current_uses = current_uses - 1 WHERE id = :id AND current_uses > 0`
5. Crear OrderEvent "Orden cancelada por el cliente"

**Expiracion de ordenes no pagadas:**
- Cron job cada 15 minutos (`@nestjs/schedule`)
- Busca ordenes con `SELECT ... WHERE status = 'pending' AND created_at < threshold FOR UPDATE SKIP LOCKED` (evita race condition con webhook de pago)
- **Cada orden se procesa en su propia transaccion** via `unitOfWork.execute()`:
  1. `UPDATE orders SET status = 'cancelled' WHERE id = :id AND status = 'pending'` (doble-check atomico)
  2. Si `affectedRows = 0` → skip (webhook la pago entre el SELECT y el UPDATE)
  3. Restaurar stock — **ordenar items por productId ASC** (previene deadlocks)
  4. Decrementar coupon uses: `WHERE current_uses > 0`
  5. Crear OrderEvent "Orden expirada por falta de pago"
- Si cualquier paso falla, rollback solo esa orden y continuar con las demas
- Procesar en batches de 50, loop hasta que batch < 50 (max 500 por ejecucion de cron)
- `ExpireUnpaidOrdersUseCase` ejecutado por `OrderExpirationCron`
- Configurable via env: `ORDER_EXPIRATION_HOURS=2`
- **Index**: `CREATE INDEX idx_orders_pending_created ON orders(created_at) WHERE status = 'pending'` (partial index, mas eficiente)

**Status transitions validas:**
```
pending → paid (via webhook/verify-payment)
pending → cancelled (customer cancela o cron expira)
paid → processing (admin)
paid → shipped (admin, al crear shipment directamente sin pasar por processing)
processing → shipped (admin, al crear shipment)
shipped → delivered (admin, al actualizar shipment)
paid/processing → refunded (admin, placeholder para v2 — solo cambia status + OrderEvent, sin restaurar stock ni llamar API MercadoPago)
```

**State machine en Order entity:**
La entidad de dominio `Order` tiene un metodo `transitionTo(newStatus: OrderStatus)` que valida las transiciones permitidas y lanza `DomainException(ORDER_INVALID_TRANSITION)` si la transicion es invalida. Esto mantiene el invariante en la entidad, no disperso en use cases.

**OrderNumber (table-based counter, sin gaps):**
En lugar de `SEQUENCE` (que produce gaps en rollbacks), usar una tabla `order_number_counters`:
```sql
CREATE TABLE order_number_counters (
  date DATE PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);
-- Dentro de la transaccion de checkout:
INSERT INTO order_number_counters (date, last_number) VALUES (CURRENT_DATE, 1)
ON CONFLICT (date) DO UPDATE SET last_number = order_number_counters.last_number + 1
RETURNING last_number;
```
Formato: `ORD-YYYYMMDD-NNN` (e.g. `ORD-20260414-001`). Gap-free, daily-reset, atomico dentro de la transaccion.

**Pago tardio en orden cancelada:**
Si el webhook de MercadoPago llega para una orden ya cancelada (`UPDATE ... WHERE status = 'pending'` retorna `affectedRows = 0`), el pago del cliente se acepto pero la orden no se puede activar. Acciones:
1. Registrar Payment con status `approved` y metadata `{ latePayment: true }`
2. Crear OrderEvent "Pago recibido post-cancelacion — requiere refund manual"
3. Log warning para alerta de admin
4. **No cambiar status de la orden** — permanece `cancelled`
5. Admin debe procesar refund manual via panel de MercadoPago

**Nota sobre refund v2**: En una futura version, el flujo de refund deberia: restaurar stock, decrementar coupon uses, llamar API de MercadoPago para reembolso automatico, y enviar email. Por ahora solo es un cambio de status.
