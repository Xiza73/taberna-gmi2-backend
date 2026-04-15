# 7. Cart

Carrito de compras por usuario. Un carrito activo por usuario.

**Entities**: `Cart`, `CartItem`

**Cart:**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| userId | uuid | FK → users, unique |

**CartItem:**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| cartId | uuid | FK → carts |
| productId | uuid | FK → products |
| quantity | integer | min 1 |

**Constraint**: unique (cartId, productId) — si ya existe, sumar cantidad

**Endpoints:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/cart` | JWT | Ver mi carrito |
| POST | `/cart/items` | JWT | Agregar item |
| PATCH | `/cart/items/:id` | JWT | Actualizar cantidad |
| DELETE | `/cart/items/:id` | JWT | Eliminar item |
| DELETE | `/cart` | JWT | Vaciar carrito |

**Use Cases**: `GetCartUseCase`, `AddCartItemUseCase`, `UpdateCartItemUseCase`, `RemoveCartItemUseCase`, `ClearCartUseCase`

**Reglas de negocio:**
- Validar stock disponible al agregar/actualizar
- Si el producto ya existe en carrito, sumar cantidad (constraint DB como safety net)
- Filtrar productos inactivos en la respuesta del carrito
- Calcular subtotales en la respuesta (price x quantity)
- **Ownership**: Todas las operaciones de cart items verifican que el item pertenece al carrito del usuario autenticado
- Usar JOIN/eager loading para cargar items con datos de producto en una sola query (evitar N+1)
