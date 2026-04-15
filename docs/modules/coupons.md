# 9. Coupons

Cupones de descuento. Admin los crea y gestiona. Customer los aplica en checkout.

**Entity**: `Coupon`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| code | string | unique, uppercase (e.g. "VERANO20") |
| type | enum | `percentage` / `fixed_amount` |
| value | integer | porcentaje (1-100) o monto en centavos |
| minPurchase | integer? | monto minimo de compra (centavos) |
| maxDiscount | integer? | tope de descuento para % (centavos) |
| maxUses | integer? | null = ilimitado |
| maxUsesPerUser | integer? | null = ilimitado (default 1) |
| currentUses | integer | default 0 |
| isActive | boolean | default true |
| startDate | timestamptz | |
| endDate | timestamptz | |

**Endpoints — Public:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/coupons/validate` | JWT | Validar cupon (codigo + subtotal) |

**Endpoints — Admin:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/coupons` | admin | Listar cupones |
| GET | `/admin/coupons/:id` | admin | Ver detalle de cupon |
| POST | `/admin/coupons` | admin | Crear cupon |
| PATCH | `/admin/coupons/:id` | admin | Editar cupon |
| DELETE | `/admin/coupons/:id` | admin | Eliminar cupon |

**Use Cases**: `ValidateCouponUseCase`, `AdminListCouponsUseCase`, `AdminGetCouponUseCase`, `CreateCouponUseCase`, `UpdateCouponUseCase`, `DeleteCouponUseCase`

**Reglas de negocio:**
- Validar: activo, dentro de fechas, usos disponibles, monto minimo
- Validar uso por usuario: contar ordenes del usuario con ese `couponId` vs `maxUsesPerUser` (validacion completa en `CreateOrderUseCase` que tiene acceso a orders; `ValidateCouponUseCase` hace preview sin check de ordenes)
- Descuento % con tope maximo opcional
- **Lock antes de validar**: Dentro de la transaccion de checkout, adquirir el cupon con `SELECT * FROM coupons WHERE id = :id FOR UPDATE` antes de validar reglas de negocio. Esto previene que dos checkouts concurrentes pasen la validacion antes del increment.
- `currentUses` se incrementa con query atomica:
  ```sql
  UPDATE coupons SET current_uses = current_uses + 1 WHERE id = :id AND (max_uses IS NULL OR current_uses < max_uses)
  ```
  Si `affectedRows = 0` → throw `DomainException(ErrorMessages.COUPON_LIMIT_REACHED)`
- **Decrement floor**: Al cancelar/expirar orden: `UPDATE coupons SET current_uses = current_uses - 1 WHERE id = :id AND current_uses > 0`
