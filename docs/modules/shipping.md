# 12. Shipping

Seguimiento de envios con carriers externos. Admin registra tracking.

**Entity**: `Shipment`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| orderId | uuid | FK → orders, unique |
| carrier | enum | `shalom` / `serpost` / `olva` / `dhl` / `other` |
| trackingNumber | string | numero de seguimiento |
| trackingUrl | string | URL generada o custom |
| status | enum | `shipped` / `in_transit` / `delivered` |
| shippedAt | timestamptz? | |
| deliveredAt | timestamptz? | |
| notes | string? | |

**Carrier URL Templates:**
| Carrier | Template |
|---------|----------|
| shalom | `https://www.shalom.com.pe/tracking/{trackingNumber}` |
| serpost | `https://tracking.serpost.com.pe/tracking/{trackingNumber}` |
| olva | `https://www.olvacourier.com/rastreo/{trackingNumber}` |
| dhl | `https://www.dhl.com/pe-es/home/rastreo.html?tracking-id={trackingNumber}` |
| other | URL custom ingresada por admin |

**Endpoints — Customer:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/orders/:id/shipment` | JWT | Ver info de envio de mi orden |

**Endpoints — Admin:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/admin/orders/:id/shipment` | admin | Registrar envio (carrier + tracking) |
| PATCH | `/admin/orders/:id/shipment` | admin | Actualizar envio |

**Use Cases**: `GetShipmentUseCase`, `CreateShipmentUseCase`, `UpdateShipmentUseCase`

**Reglas:**
- Solo se puede crear shipment si orden tiene status `paid` o `processing`
- Al crear shipment (status inicial `shipped`), orden cambia a `shipped` + OrderEvent
- Al marcar `delivered`, orden cambia a `delivered` + OrderEvent
- `trackingUrl` se genera automaticamente segun carrier template, excepto `other`
- **Ownership**: Customer solo puede ver shipment de sus propias ordenes
