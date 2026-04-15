# 4. Categories

Categorias jerarquicas (padre/hijo) para organizar productos.

**Entity**: `Category`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| name | string | |
| slug | string | unique, VO Slug |
| description | string? | |
| parentId | uuid? | FK → categories (self-ref) |
| isActive | boolean | default true |
| sortOrder | integer | default 0 |

**Endpoints — Public:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/categories` | @Public | Listar categorias activas (arbol) |
| GET | `/categories/:slug` | @Public | Detalle + productos (paginados) |

**Endpoints — Admin:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/categories` | admin | Listar todas (incluyendo inactivas) |
| GET | `/admin/categories/:id` | admin | Detalle por ID (para edicion) |
| POST | `/admin/categories` | admin | Crear categoria |
| PATCH | `/admin/categories/:id` | admin | Editar categoria |
| DELETE | `/admin/categories/:id` | admin | Eliminar (si no tiene productos ni subcategorias) |

**Use Cases**: `ListCategoriesUseCase`, `GetCategoryBySlugUseCase`, `AdminListCategoriesUseCase`, `AdminGetCategoryUseCase`, `CreateCategoryUseCase`, `UpdateCategoryUseCase`, `DeleteCategoryUseCase`
