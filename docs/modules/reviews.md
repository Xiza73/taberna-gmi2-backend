# 13. Reviews

Reseñas de productos por clientes. Admin puede aprobar/rechazar.

**Entity**: `Review`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| userId | uuid | FK → users |
| productId | uuid | FK → products |
| orderId | uuid | FK → orders (el use case busca una orden delivered con ese producto y la asigna) |
| rating | integer | 1-5 |
| comment | text? | |
| isApproved | boolean | default false |

**Constraint**: unique (userId, productId) — un review por producto por usuario.

**Endpoints — Customer:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/products/:id/reviews` | JWT | Crear review (solo si compro el producto) |
| GET | `/products/:id/reviews` | @Public | Listar reviews aprobados |

**Endpoints — Admin:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/reviews` | admin | Listar reviews pendientes |
| POST | `/admin/reviews/:id/approve` | admin | Aprobar review |
| DELETE | `/admin/reviews/:id` | admin | Eliminar review |

**Use Cases**: `CreateReviewUseCase`, `ListProductReviewsUseCase`, `AdminListPendingReviewsUseCase`, `ApproveReviewUseCase`, `DeleteReviewUseCase`

**Reglas:**
- Solo puede dejar review si tiene una orden `delivered` con ese producto
- Al aprobar, recalcular `averageRating` y `totalReviews` en Product (via `PRODUCT_REPOSITORY` inyectado desde ProductsModule)
- Al eliminar review aprobado (admin), recalcular `averageRating` y `totalReviews`
- **Sanitizacion XSS**: `comment` se sanitiza server-side (strip HTML tags) antes de almacenar. Aplicar `@MaxLength(2000)` en el DTO

**Cross-module**: ReviewsModule importa ProductsModule y usa `PRODUCT_REPOSITORY` para actualizar rating. ProductsModule exporta el token.
