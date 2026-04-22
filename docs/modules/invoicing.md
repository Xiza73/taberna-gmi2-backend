# 21. Invoicing (@Global Infrastructure)

Facturacion electronica con SUNAT (Peru). Genera boletas (B2C) y facturas (B2B). Usa proveedor tercero (Nubefact, Efact, o similar) para evitar complejidad de firmar XML y comunicarse directamente con SUNAT.

**Entity**: `Invoice`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| orderId | uuid | FK → orders |
| type | enum | `boleta` / `factura` |
| series | string | serie del comprobante (e.g. "B001", "F001") |
| number | integer | numero correlativo |
| customerDocType | enum | `dni` / `ruc` |
| customerDocNumber | string | 8 digitos (DNI) o 11 digitos (RUC) |
| customerName | string | nombre o razon social |
| subtotal | integer | centavos, antes de IGV |
| igv | integer | centavos, 18% |
| total | integer | centavos, subtotal + IGV |
| sunatStatus | enum | `pending` / `accepted` / `rejected` / `cancelled` |
| externalId | string? | ID del proveedor tercero |
| pdfUrl | string? | URL del PDF generado |
| xmlUrl | string? | URL del XML firmado |
| sunatResponse | jsonb? | respuesta completa de SUNAT via proveedor |

**Interface**: `IInvoiceProvider` + `INVOICE_PROVIDER` token
```typescript
interface IInvoiceProvider {
  createBoleta(data: CreateInvoiceData): Promise<InvoiceResult>;
  createFactura(data: CreateInvoiceData): Promise<InvoiceResult>;
  getStatus(externalId: string): Promise<InvoiceStatus>;
  cancel(externalId: string): Promise<void>;
}

interface CreateInvoiceData {
  orderId: string;
  orderNumber: string;
  items: { name: string; quantity: number; unitPrice: number; subtotal: number }[];
  subtotal: number;  // centavos
  discount: number;  // centavos
  total: number;  // centavos
  customerDocType: 'dni' | 'ruc';
  customerDocNumber: string;
  customerName: string;
  customerEmail?: string;
}

interface InvoiceResult {
  externalId: string;
  series: string;
  number: number;
  pdfUrl?: string;
  xmlUrl?: string;
  sunatStatus: 'accepted' | 'pending';
}
```

**Implementacion**: `NubefactInvoiceProvider` (o adaptable a cualquier proveedor que exponga API REST)

**Endpoints — Admin:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/admin/orders/:id/invoice` | admin | Generar boleta o factura para una orden |
| GET | `/admin/orders/:id/invoice` | admin | Ver comprobante de una orden |
| POST | `/admin/invoices/:id/cancel` | admin | Anular comprobante |
| GET | `/admin/invoices` | admin | Listar comprobantes (paginado, filtros) |

**CreateInvoiceDto:**
```
type: 'boleta' | 'factura'  // required
customerDocType: 'dni' | 'ruc'  // required (boleta acepta ambos, factura solo ruc)
customerDocNumber: string  // required, validar longitud segun tipo
customerName: string  // required (para factura: razon social)
```

**Use Cases**: `CreateInvoiceUseCase`, `GetInvoiceUseCase`, `CancelInvoiceUseCase`, `ListInvoicesUseCase`

**Reglas de negocio:**
- **Boleta**: acepta DNI o RUC. Para montos > S/ 700 (70000 centavos), DNI es obligatorio por SUNAT
- **Factura**: solo acepta RUC (11 digitos). Requiere razon social
- **IGV**: 18% incluido en el precio. `subtotal = total / 1.18`, `igv = total - subtotal` (redondeado)
- **Una factura por orden**: constraint unique (orderId) — no se puede generar dos comprobantes para la misma orden
- **Series**: Boletas usan serie "B001", Facturas usan serie "F001". El numero correlativo lo maneja el proveedor
- **Anulacion**: Solo se puede anular dentro de las 72 horas segun normativa SUNAT. El use case valida esto
- **Solo ordenes pagadas**: No se puede generar comprobante para ordenes con status != 'paid' | 'processing' | 'shipped' | 'delivered'

**Configuracion:**
```env
# Invoicing (Nubefact)
NUBEFACT_API_TOKEN=your-api-token
NUBEFACT_API_URL=https://api.nubefact.com/api/v1
NUBEFACT_RUC=your-ruc  # RUC del negocio
NUBEFACT_BUSINESS_NAME=your-business-name  # Razon social
```

**Pattern**: @Global Infrastructure. El controller vive en este modulo. POS y otros modulos inyectan `IInvoiceProvider` para generar comprobantes automaticamente.

**Nota**: Los precios en el ecommerce incluyen IGV (como es comun en retail Peru). Al generar el comprobante, se desglosa: `baseImponible = total / 1.18`, `igv = total - baseImponible`.
