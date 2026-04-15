# 11. Payments

Integracion con MercadoPago Checkout Pro.

**Nota arquitectura**: Payments NO es `@Global` — es un modulo Full DDD. OrdersModule inyecta `IPaymentProvider` (token exportado por PaymentsModule). Para el flujo inverso (webhook actualiza orden), `ProcessPaymentNotificationUseCase` vive en **OrdersModule** e inyecta `IPaymentProvider`. Esto evita la dependencia circular Orders ↔ Payments.

**Entity**: `Payment`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| orderId | uuid | FK → orders |
| externalId | string? | ID de MercadoPago, unique constraint |
| preferenceId | string? | ID de preferencia MercadoPago |
| method | string? | credit_card, debit_card, etc |
| status | enum | `pending` / `approved` / `rejected` / `refunded` |
| amount | integer | centavos |
| paidAt | timestamptz? | |
| rawResponse | jsonb? | respuesta completa de MercadoPago |

**Endpoints:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/webhooks/mercadopago` | @Public, @Throttle(100/min), @UsePipes(whitelist: true, transform: true, forbidNonWhitelisted: false) | IPN webhook — throttle generoso (no SkipThrottle) para prevenir abuso, override ValidationPipe porque MercadoPago envia campos extra |
| POST | `/orders/:id/verify-payment` | JWT, @Throttle(5/min) | Verificar estado de pago manualmente |
| GET | `/admin/orders/:id/payment` | admin | Ver detalle de pago |

**Interface**: `IPaymentProvider` + `PAYMENT_PROVIDER` token
- `createPreference(order): Promise<{ preferenceId, paymentUrl }>`
- `getPaymentInfo(paymentId): Promise<PaymentInfo>`
- `getPreferencePayments(preferenceId): Promise<PaymentInfo[]>`

**Use Cases (en PaymentsModule)**: `CreatePaymentPreferenceUseCase`, `GetPaymentDetailsUseCase`

**Use Cases (en OrdersModule, inyectan IPaymentProvider)**: `ProcessPaymentNotificationUseCase`, `VerifyPaymentUseCase` — viven en Orders para evitar dependencia circular

**Flujo webhook (camino feliz):**
1. Recibir notificacion IPN de MercadoPago
2. Verificar firma HMAC del webhook con `MERCADOPAGO_WEBHOOK_SECRET` (usar `req.rawBody`, NO `req.body`)
3. Verificar tipo (payment)
4. Consultar estado del pago via API de MercadoPago (nunca confiar solo en el body)
5. **Verificar monto**: `paymentInfo.transactionAmount === order.total`. Si no coincide → log alerta, NO marcar como paid
6. **Dentro de transaccion** (`unitOfWork.execute`): Crear/actualizar Payment (`INSERT ON CONFLICT external_id DO UPDATE`) + actualizar Order atomico (`WHERE status = 'pending'`) + crear OrderEvent. Si `affectedRows = 0` en Order, verificar si fue cancelada → ver "Pago tardio"
7. Si approved: enviar email (fire-and-forget, fuera de transaccion)
8. Si rejected: mantener pending (el cliente puede reintentar)

**IMPORTANTE**: El webhook controller **siempre retorna 200** independientemente de errores. Usar try/catch interno y loguear errores — nunca dejar que `DomainException` escape al `GlobalExceptionFilter` en este endpoint. MercadoPago reintenta si no recibe 200.

**Proteccion ante fallos de red / webhook:**

| Capa | Mecanismo | Detalle |
|------|-----------|---------|
| **1. Reintentos MercadoPago** | Automatico | MercadoPago reintenta el webhook hasta 4 veces con backoff exponencial si tu servidor no responde 200 |
| **2. Verificacion manual** | `POST /orders/:id/verify-payment` | El customer (o frontend) consulta el estado real del pago via API de MercadoPago. Si el pago fue aprobado pero el webhook no llego, este endpoint actualiza la orden |
| **3. Idempotencia** | En `ProcessPaymentNotificationUseCase` | Si el Payment ya esta `approved`, el webhook se ignora (responde 200 sin procesar). Previene duplicados por reintentos |

**Flujo verify-payment (fallback):**
1. Customer vuelve de MercadoPago (redirect URL) con status `approved`
2. Frontend llama `POST /orders/:id/verify-payment`
3. Verificar ownership: `order.userId === authenticatedUserId`
4. Backend consulta API de MercadoPago por `preferenceId` → obtiene pagos asociados
5. **Verificar monto**: `paymentInfo.transactionAmount === order.total`
6. Si hay pago approved y la orden sigue `pending`:
   - **Dentro de transaccion**: Crear/actualizar Payment + Actualizar Order atomico (`WHERE status = 'pending'`) + OrderEvent
7. Si no hay pago approved: retornar estado actual (el webhook aun puede llegar)

**Reglas de seguridad:**
- Webhook: verificar firma HMAC (requiere raw body: `NestFactory.create(AppModule, { rawBody: true })`) + consultar API de MercadoPago
- Webhook/verify-payment: update atomico `UPDATE orders SET status = 'paid' WHERE id = :id AND status = 'pending'`. Si affected rows = 0, ya fue cancelada/pagada — responder 200 sin procesar
- Verify-payment: solo el dueño de la orden puede verificar (`userId` match)
- Idempotencia: verificar estado antes de actualizar — si ya esta `paid`, no hacer nada
