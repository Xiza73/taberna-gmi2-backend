# 5. Products

Catalogo de productos con imagenes, stock, precios y filtros.

**Entity**: `Product`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| name | string | |
| slug | string | unique, VO Slug |
| description | text | |
| price | integer | centavos, siempre PEN (VO Money) |
| compareAtPrice | integer? | precio anterior (tachado) |
| sku | string? | unique |
| stock | integer | default 0 |
| images | jsonb | array de URLs (strings) |
| categoryId | uuid | FK → categories |
| isActive | boolean | default true |
| averageRating | decimal? | calculado de reviews |
| totalReviews | integer | default 0 |

**Endpoints — Public:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/products` | @Public | Listar con filtros/paginacion |
| GET | `/products/:slug` | @Public | Detalle de producto |

**Filtros de listado**: `categoryId`, `minPrice`, `maxPrice`, `search` (texto), `sortBy` (price, name, newest, rating), `page`, `limit`

**Endpoints — Admin:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/products` | admin | Listar todos (incluyendo inactivos) |
| GET | `/admin/products/:id` | admin | Detalle por ID (para edicion) |
| POST | `/admin/products` | admin | Crear producto |
| PATCH | `/admin/products/:id` | admin | Editar producto |
| DELETE | `/admin/products/:id` | admin | Eliminar producto (soft: isActive=false). Limpia cart items y wishlist items del producto. Elimina de indice ES |
| PATCH | `/admin/products/:id/stock` | admin | Ajustar stock |

**Use Cases**: `ListProductsUseCase`, `GetProductBySlugUseCase`, `AdminListProductsUseCase`, `AdminGetProductUseCase`, `CreateProductUseCase`, `UpdateProductUseCase`, `DeleteProductUseCase`, `AdjustStockUseCase`
