# 6. Banners

Banners promocionales para el storefront. Solo admin gestiona.

**Entity**: `Banner`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| title | string | descripcion interna |
| imageUrl | string | URL de la imagen |
| linkUrl | string? | a donde redirige al hacer click |
| position | enum | `hero` / `secondary` / `footer` |
| isActive | boolean | default true |
| sortOrder | integer | default 0 |
| startDate | timestamptz? | inicio de vigencia |
| endDate | timestamptz? | fin de vigencia |

**Endpoints — Public:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/banners` | @Public | Listar banners activos y vigentes |

**Endpoints — Admin:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/banners` | admin | Listar todos |
| GET | `/admin/banners/:id` | admin | Ver detalle de banner |
| POST | `/admin/banners` | admin | Crear banner |
| PATCH | `/admin/banners/:id` | admin | Editar banner |
| DELETE | `/admin/banners/:id` | admin | Eliminar banner |

**Use Cases**: `ListActiveBannersUseCase`, `AdminListBannersUseCase`, `AdminGetBannerUseCase`, `CreateBannerUseCase`, `UpdateBannerUseCase`, `DeleteBannerUseCase`
