# 17. Notifications (@Global)

Emails transaccionales. Modulo de infraestructura.

**Interface**: `IEmailSender` + `EMAIL_SENDER` token (parametros primitivos, no domain entities — mantiene desacoplado)
- `sendWelcome(props: { name, email }): Promise<void>`
- `sendOrderConfirmation(props: { orderNumber, customerName, email, items, total }): Promise<void>`
- `sendPaymentConfirmed(props: { orderNumber, customerName, email, total }): Promise<void>`
- `sendOrderShipped(props: { orderNumber, customerName, email, carrier, trackingUrl }): Promise<void>`
- `sendOrderDelivered(props: { orderNumber, customerName, email, productNames }): Promise<void>`
- `sendPasswordReset(props: { name, email, resetUrl }): Promise<void>`

**Implementacion**: `NodemailerEmailSender` (SMTP) o `ResendEmailSender`

**Configuracion**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tienda@gmail.com
SMTP_PASS=app-password
EMAIL_FROM="Mi Tienda <tienda@gmail.com>"
```

**Triggers** (llamados desde use cases de otros modulos):
| Evento | Email |
|--------|-------|
| Register | Bienvenida |
| Order created | Confirmacion de pedido |
| Payment approved | Pago confirmado |
| Shipment created | Pedido enviado + tracking URL |
| Order delivered | Pedido entregado + invitacion a dejar review |

**Pattern**: Infrastructure-only (@Global). No tiene controller. Los use cases de otros modulos inyectan `IEmailSender`.

**Importante**: Los emails son **fire-and-forget** (try/catch + log error). Un fallo de SMTP nunca debe bloquear la operacion principal (checkout, payment, etc).
