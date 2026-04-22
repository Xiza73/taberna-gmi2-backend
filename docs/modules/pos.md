# 20. POS — Point of Sale

Punto de venta completo para registrar ventas presenciales y por WhatsApp. Incluye gestion de caja, reportes diarios, anulaciones y devoluciones.

**Type:** Full DDD (tiene entidades propias: CashRegister, CashMovement)
**Tablas:** `cash_registers`, `cash_movements` (ordenes POS van en tabla `orders` con `channel != 'online'`)
**Acceso:** Solo `AdminStaff` y `SuperAdminStaff` (`@RequireStaffRole(SUPER_ADMIN, ADMIN)`)

**Dependencias**: OrdersModule, ProductsModule, CouponsModule, InvoicingModule, CustomersModule

---

## Entidades POS

### CashRegister (Caja)

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| staffId | uuid | FK → staff_members (quien abrio la caja) |
| openedAt | timestamptz | momento de apertura |
| closedAt | timestamptz? | null hasta que se cierre |
| initialAmount | integer | centavos, monto inicial en caja |
| closingAmount | integer? | centavos, monto contado al cerrar |
| expectedAmount | integer? | centavos, calculado: initial + ventas cash - egresos + ingresos |
| difference | integer? | centavos, closingAmount - expectedAmount |
| status | enum | `open` / `closed` |
| notes | text? | notas del cierre |

### CashMovement (Movimientos de caja)

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| cashRegisterId | uuid | FK → cash_registers |
| type | enum | `cash_in` / `cash_out` |
| amount | integer | centavos, siempre positivo |
| reason | string | descripcion del movimiento (max 500) |
| staffId | uuid | FK → staff_members (quien registro el movimiento) |
| createdAt | timestamptz | |

---

## Endpoints

### Ventas POS (`@RequireStaffRole(SUPER_ADMIN, ADMIN)`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/admin/pos/orders` | Staff+Admin | Crear venta directa (sin carrito) |
| GET | `/admin/pos/orders` | Staff+Admin | Listar ventas POS/WhatsApp (paginado, filtros) |
| GET | `/admin/pos/orders/:id` | Staff+Admin | Detalle de venta POS |
| POST | `/admin/pos/orders/:id/cancel` | Staff+Admin | Anular venta POS (restaura stock) |
| POST | `/admin/pos/orders/:id/refund` | Staff+SuperAdmin | Devolucion (parcial o total) |

### Caja (`@RequireStaffRole(SUPER_ADMIN, ADMIN)`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/admin/pos/cash-register/open` | Staff+Admin | Abrir caja con monto inicial |
| POST | `/admin/pos/cash-register/close` | Staff+Admin | Cerrar caja (conteo + arqueo) |
| GET | `/admin/pos/cash-register/current` | Staff+Admin | Caja abierta actual |
| GET | `/admin/pos/cash-register/:id` | Staff+Admin | Detalle de caja (incluye movimientos) |
| POST | `/admin/pos/cash-register/movements` | Staff+Admin | Registrar movimiento (ingreso/egreso) |
| GET | `/admin/pos/cash-register/movements` | Staff+Admin | Listar movimientos de la caja actual |

### Reportes POS (`@RequireStaffRole(SUPER_ADMIN, ADMIN)`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/pos/reports/daily` | Staff+Admin | Resumen diario de ventas POS |
| GET | `/admin/pos/reports/by-payment-method` | Staff+Admin | Ventas por metodo de pago (rango de fechas) |
| GET | `/admin/pos/reports/by-staff` | Staff+SuperAdmin | Ventas por vendedor (rango de fechas) |

---

## DTOs

### CreatePosOrderDto
```
items: [{ productId: uuid, quantity: number }]  // required, min 1
paymentMethod: 'cash' | 'yape_plin' | 'bank_transfer' | 'mercadopago'  // required
channel: 'pos' | 'whatsapp'  // required
customerName: string  // required
customerEmail: string?  // optional (venta presencial puede no tener email)
customerPhone: string?  // optional
customerDocType: 'dni' | 'ruc'?  // optional, para facturacion
customerDocNumber: string?  // optional, validar formato segun tipo
couponCode: string?  // optional
addressId: uuid?  // optional, solo WhatsApp con delivery
notes: string?  // optional
generateInvoice: boolean?  // default false
invoiceType: 'boleta' | 'factura'?  // required si generateInvoice = true
```

### PosOrderFiltersDto (extends PaginationDto)
```
channel: 'pos' | 'whatsapp'?
paymentMethod: string?
dateFrom: string?  // ISO date
dateTo: string?  // ISO date
search: string?  // orderNumber
staffId: uuid?  // filtrar por vendedor
sortBy: 'createdAt' | 'total'?  // default createdAt DESC
```

### CancelPosOrderDto
```
reason: string  // @IsString, @MaxLength(500), motivo de anulacion
```

### RefundPosOrderDto
```
items: [{ orderItemId: uuid, quantity: number }]?  // null = devolucion total
reason: string  // @IsString, @MaxLength(500)
```

### OpenCashRegisterDto
```
initialAmount: number  // @IsInt, @Min(0), centavos
```

### CloseCashRegisterDto
```
closingAmount: number  // @IsInt, @Min(0), centavos contados
notes: string?  // @MaxLength(2000)
```

### CreateCashMovementDto
```
type: 'cash_in' | 'cash_out'  // @IsEnum
amount: number  // @IsInt, @Min(1), centavos
reason: string  // @IsString, @MaxLength(500)
```

### DailyReportQueryDto
```
date: string?  // ISO date, default today
```

### PaymentMethodReportQueryDto
```
dateFrom: string  // ISO date
dateTo: string  // ISO date
```

---

## Use Cases

### Ventas
- **CreatePosOrderUseCase** — Crear venta directa (ver flujo abajo)
- **ListPosOrdersUseCase** — Listar ordenes con channel != 'online'
- **GetPosOrderUseCase** — Detalle de orden POS
- **CancelPosOrderUseCase** — Anular venta (restaurar stock, revertir cupon)
- **RefundPosOrderUseCase** — Devolucion parcial/total (restaurar stock parcial, crear OrderEvent)

### Caja
- **OpenCashRegisterUseCase** — Abrir caja (validar que no hay otra abierta por el mismo staff)
- **CloseCashRegisterUseCase** — Cerrar caja (calcular expectedAmount, difference)
- **GetCurrentCashRegisterUseCase** — Obtener caja abierta actual
- **GetCashRegisterUseCase** — Detalle de caja con movimientos
- **CreateCashMovementUseCase** — Registrar ingreso/egreso (validar caja abierta)
- **ListCashMovementsUseCase** — Listar movimientos de una caja

### Reportes
- **GetDailyPosReportUseCase** — Resumen: total ventas, por metodo de pago, items vendidos, anulaciones
- **GetPaymentMethodReportUseCase** — Desglose por metodo de pago en rango de fechas
- **GetStaffSalesReportUseCase** — Ventas por vendedor en rango de fechas

---

## Flujo CreatePosOrderUseCase

```
1. Validar items no vacios (POS_ITEMS_EMPTY)
2. Validar productos existen y estan activos
3. Si addressId: validar que exista (para WhatsApp con delivery)
4. Si couponCode: validar cupon (misma logica que checkout online)
5. Si generateInvoice con factura: validar customerDocType=ruc y customerDocNumber (11 digitos)

BEGIN TRANSACTION
  6. Validar stock de cada item (SELECT FOR UPDATE)
  7. Snapshot: copiar datos de productos, cliente
  8. Calcular totales (subtotal, descuento cupon, shippingCost solo si address, total)
  9. Generar orderNumber via table-based counter
  10. Crear orden con:
      - userId = staffId (quien registra la venta)
      - channel = dto.channel ('pos' o 'whatsapp')
      - paymentMethod = dto.paymentMethod
      - status = 'paid' (excepto mercadopago → 'pending')
      - customerName/Email/Phone/DocType/DocNumber del dto
      - shippingAddressSnapshot = null (POS) o snapshot de address (WhatsApp con delivery)
  11. Crear order items + OrderEvent "Venta POS registrada por {staffName}" o "Venta WhatsApp registrada por {staffName}"
  12. Descontar stock atomico: UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty
  13. Incrementar coupon uses si aplica
COMMIT

14. Si generateInvoice = true → CreateInvoiceUseCase (fire-and-forget via InvoicingModule)
15. Si customerEmail → enviar comprobante por email (fire-and-forget)
```

---

## Flujo CancelPosOrderUseCase

```
BEGIN TRANSACTION
  1. Buscar orden, validar channel != 'online' (solo POS/WhatsApp)
  2. Validar status = 'paid' (solo ordenes pagadas POS se pueden anular)
  3. UPDATE orders SET status = 'cancelled' WHERE id = :id AND status = 'paid'
  4. Restaurar stock de cada item (ordenar por productId ASC — deadlock prevention)
  5. Si habia cupon: decrementar current_uses
  6. Crear OrderEvent "Venta anulada por {staffName}: {reason}"
COMMIT

7. Si tiene invoice → CancelInvoiceUseCase (fire-and-forget, si dentro de 72h)
```

---

## Flujo RefundPosOrderUseCase

```
BEGIN TRANSACTION
  1. Buscar orden, validar channel != 'online'
  2. Validar status = 'paid' o 'processing'
  3. Si devolucion total (items = null):
     - UPDATE orders SET status = 'refunded'
     - Restaurar TODO el stock
  4. Si devolucion parcial (items especificados):
     - Validar que items pertenecen a la orden
     - Validar que cantidades no excedan lo comprado
     - Restaurar stock parcial
     - Crear OrderEvent con detalle de items devueltos
     - Status permanece (no cambia a refunded si es parcial)
  5. Crear OrderEvent "Devolucion por {staffName}: {reason}"
COMMIT
```

---

## Cash Register: Reglas

- Solo puede haber **una caja abierta por staff** a la vez
- Para crear ventas POS con paymentMethod `cash` se **recomienda** tener caja abierta (warning, no bloqueo)
- Al cerrar caja se calcula:
  - `expectedAmount = initialAmount + ventasCash - cashOut + cashIn`
  - `difference = closingAmount - expectedAmount`
- El `difference` permite detectar faltantes o sobrantes
- Cajas cerradas son inmutables (no se pueden reabrir ni editar)

---

## Diferencias con checkout online

| Aspecto | Online | POS/WhatsApp |
|---------|--------|--------------|
| Origen | Customer via carrito | Staff selecciona productos directamente |
| Pago | MercadoPago redirect | Inmediato (cash/yape/transfer) o MercadoPago |
| Status inicial | `pending` (espera pago) | `paid` (excepto mercadopago → `pending`) |
| Shipping address | Requerido siempre | Opcional (solo WhatsApp con delivery) |
| Email cliente | Siempre (es del customer registrado) | Opcional (venta presencial sin email) |
| Facturacion SUNAT | No por defecto | Opcional, integrado |
| userId | ID del customer | ID del staff que registra |
| Cancelacion | Customer cancela pending | Staff anula paid |
| Devolucion | No implementado (v2) | Staff puede devolver parcial/total |

---

## Repository: ICashRegisterRepository + CASH_REGISTER_REPOSITORY

- `findById(id)`: CashRegister | null
- `findOpenByStaff(staffId)`: CashRegister | null
- `findAll(params)`: { items: CashRegister[]; total: number }
- `save(entity)`: CashRegister

## Repository: ICashMovementRepository + CASH_MOVEMENT_REPOSITORY

- `findByCashRegister(cashRegisterId)`: CashMovement[]
- `save(entity)`: CashMovement

---

## ErrorMessages POS

```typescript
POS_ITEMS_EMPTY: 'At least one item is required',
POS_INVALID_DOC_NUMBER: 'Invalid document number for the specified type',
POS_CASH_REGISTER_ALREADY_OPEN: 'You already have an open cash register',
POS_CASH_REGISTER_NOT_OPEN: 'No open cash register found',
POS_CASH_REGISTER_NOT_FOUND: 'Cash register not found',
POS_ORDER_NOT_POS: 'This order is not a POS/WhatsApp order',
POS_ORDER_CANNOT_CANCEL: 'Only paid POS orders can be cancelled',
POS_ORDER_CANNOT_REFUND: 'Only paid or processing POS orders can be refunded',
POS_REFUND_QUANTITY_EXCEEDED: 'Refund quantity exceeds purchased quantity',
```
