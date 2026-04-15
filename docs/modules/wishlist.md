# 15. Wishlist

Lista de deseos del customer. Simple: una relacion usuario-producto.

**Entity**: `WishlistItem`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| userId | uuid | FK → users |
| productId | uuid | FK → products |

**Constraint**: unique (userId, productId)

**Endpoints:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/wishlist` | JWT | Listar mi wishlist (con datos del producto) |
| POST | `/wishlist/:productId` | JWT | Agregar producto |
| DELETE | `/wishlist/:productId` | JWT | Quitar producto |

**Use Cases**: `ListWishlistUseCase`, `AddToWishlistUseCase`, `RemoveFromWishlistUseCase`

**Reglas**: Filtrar productos inactivos en la respuesta del listado.
