# 3. Users

Gestion de usuarios. Customer gestiona su perfil. Admin gestiona todos los usuarios.

**Entity**: `User`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| name | string | |
| email | string | unique, VO Email |
| password | string | bcrypt hash |
| phone | string? | VO PhoneNumber |
| role | enum | `admin` / `customer` |
| isActive | boolean | default true (admin puede suspender) |
| resetPasswordToken | string? | bcrypt hash del token de reset |
| resetPasswordExpires | timestamptz? | expiracion del token de reset |
| googleId | string? | Google OAuth sub ID (unique) |

**Endpoints — Customer:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/users/profile` | JWT | Ver mi perfil |
| PATCH | `/users/profile` | JWT | Actualizar mi perfil |
| PATCH | `/users/change-password` | JWT | Cambiar contraseña |

**Endpoints — Admin:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/users` | admin | Listar usuarios (paginado) |
| GET | `/admin/users/:id` | admin | Ver detalle de usuario |
| PATCH | `/admin/users/:id` | admin | Editar usuario |
| POST | `/admin/users/:id/suspend` | admin | Suspender usuario |
| POST | `/admin/users/:id/activate` | admin | Activar usuario |

**Use Cases**: `GetProfileUseCase`, `UpdateProfileUseCase`, `ChangePasswordUseCase`, `ListUsersUseCase`, `GetUserUseCase`, `UpdateUserUseCase`, `SuspendUserUseCase`, `ActivateUserUseCase`
