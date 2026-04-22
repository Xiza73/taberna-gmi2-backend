# 4. Staff

Gestion del personal del backoffice. Tres roles con diferentes niveles de acceso. Sistema de invitacion por email.

**Type:** Full DDD
**Tablas:** `staff_members`, `staff_invitations`

---

## Roles (StaffRole enum)

| Rol | Valor DB | Descripcion | Permisos clave |
|-----|----------|-------------|----------------|
| **SuperAdmin** | `super_admin` | Primer usuario registrado (seed). Acceso total | Invitar Admin y User, gestionar roles, POS, dashboard, todo |
| **Admin** | `admin` | Staff administrativo | POS, gestionar productos/categorias/ordenes/clientes, invitar UserStaff |
| **User** | `user` | Staff basico (atencion al cliente, logistica) | Ver ordenes, gestionar envios, operaciones basicas |

### Jerarquia de invitacion
- SuperAdmin puede invitar → Admin, User
- Admin puede invitar → User solamente
- User no puede invitar

### Restricciones de roles
- Solo SuperAdmin puede cambiar roles de otros staff
- No se puede cambiar el propio rol
- No se puede suspender a si mismo
- Debe existir al menos un SuperAdmin activo en todo momento

---

## Entity: StaffMember

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| name | string | max 100 |
| email | string | unique, VO Email |
| password | string | bcrypt hash |
| role | StaffRole | `super_admin` / `admin` / `user`, default `user` |
| isActive | boolean | default true |
| invitedBy | uuid? | FK → staff_members (quien lo invito) |
| googleId | string? | unique, para Google OAuth |
| resetPasswordToken | string? | bcrypt hash del token de reset |
| resetPasswordExpires | timestamptz? | |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

## Entity: StaffInvitation

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| email | string | email del invitado |
| role | StaffRole | rol asignado |
| tokenHash | string | bcrypt hash del token de invitacion |
| invitedBy | uuid | FK → staff_members |
| expiresAt | timestamptz | 72h desde creacion |
| acceptedAt | timestamptz? | null hasta que se acepte |
| isRevoked | boolean | default false |
| createdAt | timestamptz | |

---

## Endpoints — Staff Self-Management (`@RequireSubjectType(STAFF)`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/staff/profile` | JWT+Staff | Ver mi perfil |
| PATCH | `/staff/profile` | JWT+Staff | Actualizar nombre |
| PATCH | `/staff/change-password` | JWT+Staff | Cambiar contrasena |

## Endpoints — Staff Admin (`@RequireSubjectType(STAFF)`, `@RequireStaffRole(SUPER_ADMIN, ADMIN)`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/staff` | JWT+SuperAdmin/Admin | Listar staff (paginado, filtro role/isActive) |
| GET | `/admin/staff/:id` | JWT+SuperAdmin/Admin | Ver detalle de staff |
| PATCH | `/admin/staff/:id/role` | JWT+SuperAdmin | Cambiar rol (solo SuperAdmin) |
| POST | `/admin/staff/:id/suspend` | JWT+SuperAdmin | Suspender staff |
| POST | `/admin/staff/:id/activate` | JWT+SuperAdmin | Activar staff |

## Endpoints — Invitations (`@RequireSubjectType(STAFF)`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/admin/staff/invitations` | JWT+SuperAdmin/Admin | Crear invitacion |
| GET | `/admin/staff/invitations` | JWT+SuperAdmin/Admin | Listar invitaciones pendientes |
| DELETE | `/admin/staff/invitations/:id` | JWT+SuperAdmin/Admin | Revocar invitacion |

## Endpoints — Registration via Invitation (`@Public`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/staff/invitations/:token/validate` | Public | Validar token de invitacion (retorna email + rol) |
| POST | `/staff/invitations/:token/accept` | Public, @Throttle(5/min) | Registrarse usando invitacion |

---

## Invitation Flow

```
1. SuperAdmin/Admin → POST /admin/staff/invitations { email, role }
2. InviteStaffUseCase:
   - Validar que el invitador puede invitar ese rol (jerarquia)
   - Si ya existe invitacion pendiente para ese email → revocar anterior
   - Si ya existe staff con ese email → error STAFF_EMAIL_ALREADY_EXISTS
   - Generar token aleatorio (uuid v4)
   - Guardar StaffInvitation con tokenHash (bcrypt)
   - Enviar email con link: FRONTEND_URL/staff/register?token={rawToken}
3. Invitado visita link → GET /staff/invitations/:token/validate
   - Buscar invitacion por token (bcrypt compare)
   - Validar no expirada, no revocada, no aceptada
   - Retorna { email, role, invitedByName }
4. Invitado completa formulario → POST /staff/invitations/:token/accept { name, password }
   - Validar token nuevamente
   - Crear StaffMember con role de la invitacion, invitedBy del invitador
   - Marcar invitacion como acceptedAt = now()
   - Generar JWT tokens (login automatico)
   - Enviar welcome email
```

---

## DTOs

**InviteStaffDto:**
```
email: string  // @IsEmail, required
role: 'admin' | 'user'  // @IsEnum, required (no se puede invitar super_admin)
```

**AcceptInvitationDto:**
```
name: string  // @IsString, @MinLength(2), @MaxLength(100)
password: string  // @MinLength(8), @MaxLength(128)
```

**StaffMemberResponseDto:** `id, name, email, role, isActive, invitedBy, createdAt`

**StaffQueryDto** (extends PaginationDto): `search?, role?, isActive?`

---

## Use Cases

- **InviteStaffUseCase** — Crear invitacion y enviar email
- **ValidateInvitationUseCase** — Validar token sin side effects
- **AcceptInvitationUseCase** — Registrar staff con token
- **ListInvitationsUseCase** — Listar invitaciones pendientes
- **RevokeInvitationUseCase** — Revocar invitacion
- **GetStaffProfileUseCase** — Perfil propio
- **UpdateStaffProfileUseCase** — Actualizar nombre
- **ChangeStaffPasswordUseCase** — Cambiar contrasena (revoca refresh tokens)
- **AdminListStaffUseCase** — Listar staff con filtros
- **AdminGetStaffUseCase** — Detalle de staff
- **UpdateStaffRoleUseCase** — Cambiar rol (solo SuperAdmin)
- **SuspendStaffUseCase** — Suspender (no puede suspenderse a si mismo, debe quedar >=1 SuperAdmin activo)
- **ActivateStaffUseCase** — Activar staff suspendido

---

## Repository: IStaffMemberRepository + STAFF_MEMBER_REPOSITORY

- `findById(id)`: StaffMember | null
- `findByEmail(email)`: StaffMember | null
- `findByGoogleId(googleId)`: StaffMember | null
- `findAll(params)`: { items: StaffMember[]; total: number }
- `save(entity)`: StaffMember
- `countByRole(role)`: number (para validar minimo 1 SuperAdmin)

## Repository: IStaffInvitationRepository + STAFF_INVITATION_REPOSITORY

- `findById(id)`: StaffInvitation | null
- `findByTokenHash(tokenHash)`: StaffInvitation | null
- `findPendingByEmail(email)`: StaffInvitation | null
- `findAll(params)`: { items: StaffInvitation[]; total: number }
- `save(entity)`: StaffInvitation

**DI Exports**: `STAFF_MEMBER_REPOSITORY` (necesario para JwtAuthGuard, AuthModule)
