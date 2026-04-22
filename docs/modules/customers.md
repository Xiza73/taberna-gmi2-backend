# 3. Customers

Gestion de clientes del ecommerce. El customer gestiona su perfil. Staff gestiona todos los clientes desde el backoffice.

**Type:** Full DDD
**Tabla:** `customers`

**Entity**: `Customer`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| name | string | max 100 |
| email | string | unique, VO Email |
| password | string | bcrypt hash |
| phone | string? | VO PhoneNumber |
| isActive | boolean | default true (staff puede suspender) |
| googleId | string? | unique, para Google OAuth |
| resetPasswordToken | string? | bcrypt hash del token de reset |
| resetPasswordExpires | timestamptz? | expiracion del token de reset |

**Endpoints — Customer** (`@RequireSubjectType(CUSTOMER)`):
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/customers/profile` | JWT | Ver mi perfil |
| PATCH | `/customers/profile` | JWT | Actualizar nombre, telefono |
| PATCH | `/customers/change-password` | JWT | Cambiar contrasena |

**Endpoints — Admin** (`@RequireSubjectType(STAFF)`):
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/customers` | JWT+Staff | Listar clientes (paginado, search, filtro isActive) |
| GET | `/admin/customers/:id` | JWT+Staff | Ver detalle de cliente |
| PATCH | `/admin/customers/:id` | JWT+Staff | Editar cliente |
| POST | `/admin/customers/:id/suspend` | JWT+Staff | Suspender cliente |
| POST | `/admin/customers/:id/activate` | JWT+Staff | Activar cliente |

**Use Cases**: `GetCustomerProfileUseCase`, `UpdateCustomerProfileUseCase`, `ChangeCustomerPasswordUseCase`, `AdminListCustomersUseCase`, `AdminGetCustomerUseCase`, `AdminUpdateCustomerUseCase`, `SuspendCustomerUseCase`, `ActivateCustomerUseCase`

**Repository**: `ICustomerRepository` + `CUSTOMER_REPOSITORY` token
- `findById(id)`: Customer | null
- `findByEmail(email)`: Customer | null
- `findByGoogleId(googleId)`: Customer | null
- `findAll(params)`: { items: Customer[]; total: number }
- `save(entity)`: Customer

**DI Exports**: `CUSTOMER_REPOSITORY` (necesario para JwtAuthGuard, AuthModule, OrdersModule)
