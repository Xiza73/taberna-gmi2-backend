# Changelog de Decisiones de Diseño

Este archivo documenta TODOS los cambios realizados a los archivos de diseño/referencia y el motivo de cada uno.
**Propósito**: Evitar que revisiones futuras reviertan o repitan correcciones ya validadas.

---

## Reglas Consolidadas (NO revertir)

### R1: Guard chain order = ThrottlerGuard → JwtAuthGuard → RolesGuard
- **Por qué**: Throttle ANTES de auth para bloquear brute-force sin gastar CPU en JWT parsing + DB lookup
- **Archivos afectados**: CLAUDE.md, architecture.md, guards-interceptors.md, auth.md, IMPLEMENTATION-PLAN.md
- **Error anterior**: Algunos archivos tenían el orden invertido (Auth → Throttle → Roles)

### R2: GlobalExceptionFilter (NO "HttpExceptionFilter")
- **Por qué**: La clase se llama `GlobalExceptionFilter` porque captura TODAS las excepciones (@Catch()), no solo HttpException
- **Archivos afectados**: error-handling.md (línea 148 tabla, línea 58 clase), architecture.md, guards-interceptors.md, testing.md (línea 120 E2E ejemplo)
- **Error anterior**: Varios archivos referían "HttpExceptionFilter" — nombre incorrecto

### R3: SearchModule es Full DDD, NO @Global
- **Por qué**: En NestJS, providers locales de un módulo SIEMPRE tienen precedencia sobre providers de módulos @Global. Si SearchModule fuera @Global y ProductsModule tuviera un provider local con el mismo token, el @Global NUNCA ganaría. Solución: ProductsModule usa `@Optional() @Inject(PRODUCT_SEARCH_SYNC)` con null-check, e importa SearchModule directamente cuando existe (Phase 16+)
- **Archivos afectados**: CONTEXT.md, IMPLEMENTATION-PLAN.md (línea 673), modules-controllers.md (nota línea 71)
- **Error anterior**: SearchModule estaba marcado como @Global asumiendo que overridearía providers locales

### R4: Webhook usa @Throttle(100/min), NO @SkipThrottle
- **Por qué**: @SkipThrottle elimina toda protección — un atacante podría bombardear el endpoint. @Throttle con límite alto (100/min) permite tráfico legítimo de MercadoPago pero previene abuso
- **Archivos afectados**: modules-controllers.md (línea 166), guards-interceptors.md (línea 113), CONTEXT.md
- **Error anterior**: guards-interceptors.md y modules-controllers.md decían @SkipThrottle()

### R5: Webhook necesita @UsePipes con config completa
- **Por qué**: @UsePipes() REEMPLAZA el global ValidationPipe para ese handler. Sin config explícita, se pierde whitelist/transform. `forbidNonWhitelisted: false` porque MercadoPago envía campos extra que no controlamos
- **Archivos afectados**: modules-controllers.md (línea 170), CONTEXT.md, IMPLEMENTATION-PLAN.md
- **Config**: `@UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }))`

### R6: Admin controller NO lleva @UseGuards(RolesGuard)
- **Por qué**: RolesGuard ya está registrado como APP_GUARD global. @UseGuards(RolesGuard) lo ejecutaría DOS veces. Solo necesita @Roles('admin')
- **Archivos afectados**: modules-controllers.md (líneas 156-158)
- **Error anterior**: El ejemplo tenía @UseGuards(RolesGuard) redundante

### R7: PaymentsModule NO es @Global
- **Por qué**: Solo OrdersModule necesita PaymentsModule. Hacerlo @Global expondría tokens de pago a módulos que no los necesitan (principio de menor privilegio). OrdersModule lo importa explícitamente
- **Archivos afectados**: architecture.md (línea 132, decisión D5), CONTEXT.md
- **Error anterior**: Algunos documentos lo listaban como @Global

### R8: JWT_EXPIRATION default = 300 (5 min), NO 900
- **Por qué**: Access tokens cortos (5 min) + refresh token rotation (7 días) es más seguro. 15 min era demasiado largo para un token que viaja en cada request
- **Archivos afectados**: auth.md (línea 90)
- **Error anterior**: auth.md decía 900 (15 min)

### R9: DomainUnauthorizedException → 401 en la jerarquía
- **Por qué**: Necesario para manejar credenciales inválidas, tokens expirados, etc. Sin esta excepción, se caería al catch genérico 400
- **Archivos afectados**: error-handling.md (líneas 9, 26-28), CLAUDE.md (línea 133)
- **Error anterior**: La jerarquía original no incluía 401

### R10: ErrorMessages debe incluir TODOS los mensajes del sistema
- **Por qué**: Centralizar strings de error para consistencia y testability
- **Mensajes agregados**: SLUG_ALREADY_EXISTS, SKU_ALREADY_EXISTS, COUPON_CODE_ALREADY_EXISTS, ADDRESS_LIMIT_REACHED, PAYMENT_NOT_FOUND
- **Archivos afectados**: error-handling.md (líneas 127-132)
- **Error anterior**: Solo tenía un subconjunto — faltaban mensajes para slugs, SKUs, cupones, direcciones

### R11: GlobalExceptionFilter se registra via APP_FILTER (DI), NO en main.ts
- **Por qué**: `app.useGlobalFilters(new GlobalExceptionFilter())` bypasea inyección de dependencias. Usando `{ provide: APP_FILTER, useClass: GlobalExceptionFilter }` el filter puede inyectar Logger y otros servicios
- **Archivos afectados**: architecture.md (líneas 183-184, 204)

### R12: JwtAuthGuard usa useExisting (no useClass) en APP_GUARD
- **Por qué**: JwtAuthGuard necesita JwtService y UserRepository via DI. useClass crearía una nueva instancia sin resolver dependencias. useExisting usa la instancia ya registrada como provider (que SÍ tiene DI resuelto)
- **Archivos afectados**: architecture.md (línea 208), IMPLEMENTATION-PLAN.md
- **Requisito**: AuthModule debe exportar JwtModule, UsersModule debe exportar USER_REPOSITORY

---

## Historial de Cambios por Archivo

### error-handling.md
| Línea | Antes | Después | Regla |
|---|---|---|---|
| 148 | `HttpExceptionFilter` | `GlobalExceptionFilter` | R2 |
| 127-132 | (no existían) | 4 ErrorMessages agregados | R10 |

### modules-controllers.md
| Línea | Antes | Después | Regla |
|---|---|---|---|
| 158 | `@UseGuards(RolesGuard)` | (eliminado) | R6 |
| 166 | `@SkipThrottle()` | `@Throttle({ default: { limit: 100, ttl: 60000 } })` | R4 |
| 170 | (no existía) | `@UsePipes(new ValidationPipe({...}))` | R5 |

### guards-interceptors.md
| Línea | Antes | Después | Regla |
|---|---|---|---|
| 113 | `@SkipThrottle() on webhook endpoints` | `@Throttle(100/min)` con nota | R4 |

### IMPLEMENTATION-PLAN.md
| Línea | Antes | Después | Regla |
|---|---|---|---|
| 673 | `@Global (exporta PRODUCT_SEARCH_SYNC...)` | `Full DDD (exporta PRODUCT_SEARCH_SYNC...)` | R3 |

### testing.md
| Línea | Antes | Después | Regla |
|---|---|---|---|
| 120 | `new HttpExceptionFilter()` | `new GlobalExceptionFilter()` | R2 |

### architecture.md (cambios de sesiones anteriores)
| Área | Cambio | Regla |
|---|---|---|
| Guard registration | Orden corregido + APP_FILTER agregado | R1, R11 |
| PaymentsModule | Removido @Global | R7 |
| JwtAuthGuard | useExisting, no useClass | R12 |
| Bootstrap | rawBody: true, APP_FILTER comment | R11 |

### auth.md (cambios de sesiones anteriores)
| Área | Cambio | Regla |
|---|---|---|
| JWT_EXPIRATION | 900 → 300 | R8 |
| Guard order | Corregido a Throttler → Auth → Roles | R1 |

### CONTEXT.md (cambios de sesiones anteriores)
| Área | Cambio | Regla |
|---|---|---|
| SearchModule | @Global → Full DDD + @Optional() pattern | R3 |
| Webhook | @SkipThrottle → @Throttle(100/min) + @UsePipes | R4, R5 |
| PaymentsModule | Removido @Global | R7 |
| Exception hierarchy | Agregado DomainUnauthorizedException | R9 |

---

### R13: ErrorMessages — fuente autoritativa es IMPLEMENTATION-PLAN.md
- **Por qué**: error-handling.md tenía un subset incompleto (15 mensajes) mientras IMPLEMENTATION-PLAN.md tenía la lista completa (50+). Además el wording difería (ej: "User account is suspended" vs "Account is suspended")
- **Archivos afectados**: error-handling.md (reescrito completo de ErrorMessages)
- **Regla**: IMPLEMENTATION-PLAN.md es la fuente de verdad para mensajes. error-handling.md debe ser copia exacta

### R14: CONTEXT.md — solo patrón @Optional() para SearchModule sync
- **Por qué**: CONTEXT.md mencionaba AMBOS patrones (viejo NullProductSearchSync + nuevo @Optional()) causando confusión. Solo el patrón @Optional() es correcto (ver R3)
- **Archivos afectados**: CONTEXT.md (líneas 900-909 simplificadas)
- **Error anterior**: Texto mencionaba "NullProductSearchSync", "ProductSearchSyncModule condicional" junto al patrón correcto

### R15: POS reutiliza Order entity con campo `channel`
- **Por qué**: Crear una entidad `Sale` separada duplicaría lógica de stock, cupones y reportes. Una sola tabla `orders` con `channel` enum unifica todo
- **Archivos afectados**: orders.md (nuevos campos), pos.md (nuevo módulo), CONTEXT-GLOBAL.md (constraints)
- **Regla**: Ventas POS/WhatsApp son Orders con `channel != 'online'` y `paymentMethod != 'mercadopago'`. Status va directo a `paid` (excepto si paymentMethod es mercadopago)

### R16: shippingAddressSnapshot nullable para POS
- **Por qué**: Ventas presenciales no tienen dirección de envío. Pero ventas online SIEMPRE requieren dirección
- **Archivos afectados**: orders.md, CONTEXT-GLOBAL.md (CHECK constraint `chk_orders_online_address`)
- **Regla**: `CHECK (channel != 'online' OR shipping_address_snapshot IS NOT NULL)` — online siempre requiere address, POS/WhatsApp es opcional

### R17: Invoicing usa proveedor tercero (Nubefact), NO integración directa SUNAT
- **Por qué**: Integración directa con SUNAT requiere certificados digitales, firmar XML, manejar CDR, etc. Un proveedor tercero expone API REST simple
- **Archivos afectados**: invoicing.md (nuevo módulo), CONTEXT-GLOBAL.md (env vars)
- **Regla**: `IInvoiceProvider` interface con implementación `NubefactInvoiceProvider`. Si se cambia de proveedor, solo se cambia la implementación

### R18: Dos módulos separados — CustomersModule + StaffModule (NO UsersModule unificado)
- **Por qué**: El ecommerce (storefront) y el backoffice son dos productos distintos con diferentes flujos de auth, permisos y datos. Customers tienen Google OAuth, wishlist, carrito. Staff tiene roles, invitaciones, POS. Unificarlos en una tabla `users` complicaría guards, queries y permisos
- **Archivos afectados**: customers.md (nuevo), staff.md (nuevo), users.md (eliminado), auth.md, shared.md, CONTEXT-GLOBAL.md, IMPLEMENTATION-PLAN.md
- **Tablas DB**: `customers` (ecommerce), `staff_members` (backoffice), `staff_invitations` (sistema de invitación)
- **JWT payload**: `subjectType: 'customer' | 'staff'` determina contra qué repo se valida

### R19: Staff tiene 3 roles — SuperAdminStaff, AdminStaff, UserStaff
- **Por qué**: Un negocio pequeño necesita jerarquía: el dueño (SuperAdmin) invita a sus empleados con distintos niveles de acceso. El cajero (Admin) puede vender pero no cambiar roles. El operador (User) solo gestiona envíos
- **Archivos afectados**: staff.md, shared.md (StaffRole enum), CONTEXT-GLOBAL.md
- **Enum StaffRole**: `SUPER_ADMIN = 'super_admin'`, `ADMIN = 'admin'`, `USER = 'user'`
- **Jerarquía de invitación**: SuperAdmin → Admin, User. Admin → User. User → nadie

### R20: Sistema de invitación para staff (no registro público)
- **Por qué**: En un negocio real, solo el dueño o admin decide quién tiene acceso al backoffice. Un endpoint de registro público sería un riesgo de seguridad
- **Archivos afectados**: staff.md, auth.md, IMPLEMENTATION-PLAN.md
- **Flujo**: SuperAdmin/Admin crea invitación → email con token → invitado se registra con ese token → staff creado con rol asignado
- **Entidad**: StaffInvitation con tokenHash (bcrypt), expiresAt (72h), role, invitedBy

### R21: Guard chain = ThrottlerGuard → JwtAuthGuard → SubjectTypeGuard → StaffRoleGuard
- **Por qué**: Extensión de R1. SubjectTypeGuard reemplaza a RolesGuard (que asumía modelo unificado). StaffRoleGuard agrega granularidad dentro de staff. Ambos usan `useExisting` como JwtAuthGuard (R12)
- **Archivos afectados**: shared.md, CLAUDE.md, IMPLEMENTATION-PLAN.md (Phase 1, Phase 17.2)
- **Decorators**: `@RequireSubjectType(STAFF)` y `@RequireStaffRole(SUPER_ADMIN, ADMIN)`
- **Nota**: SubjectTypeGuard y StaffRoleGuard son permisivos si no hay decorator (permite paso)

### R22: POS accesible solo para AdminStaff y SuperAdminStaff
- **Por qué**: El punto de venta maneja dinero real. Solo personal autorizado debe poder registrar ventas y gestionar caja
- **Archivos afectados**: pos.md, IMPLEMENTATION-PLAN.md
- **Decorator en controller**: `@RequireStaffRole(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)`

### R23: POS es Full DDD con entidades CashRegister y CashMovement
- **Por qué**: Un POS completo necesita gestión de caja (apertura, cierre, arqueo, movimientos). Estas son entidades propias del módulo POS, no del módulo Orders
- **Archivos afectados**: pos.md, CONTEXT-GLOBAL.md, IMPLEMENTATION-PLAN.md
- **Tablas DB**: `cash_registers`, `cash_movements`
- **Regla**: Solo una caja abierta por staff a la vez

### R24: Seed inicial crea SuperAdminStaff en tabla staff_members (NO users)
- **Por qué**: El primer usuario del sistema es el dueño del negocio. Se crea via seed migration en la tabla `staff_members` con role `super_admin`. NO existe tabla `users`
- **Archivos afectados**: SeedAdminUser migration (renombrar a SeedSuperAdminStaff), IMPLEMENTATION-PLAN.md
- **Datos**: email `admin@tienda.com`, password `Admin123!`, role `super_admin`

---

## Notas para Revisores Futuros

1. **NO revertir ninguna regla R1-R24** sin entender el "Por qué"
2. **Si un agente sugiere @Global para SearchModule** → está mal, ver R3
3. **Si un agente sugiere @SkipThrottle para webhooks** → está mal, ver R4
4. **Si un agente sugiere @UseGuards(RolesGuard) en admin** → está mal, ver R6 y R21
5. **Si un agente sugiere useClass para JwtAuthGuard/SubjectTypeGuard/StaffRoleGuard** → está mal, ver R12 y R21
6. **Si un agente sugiere NullProductSearchSync** → está mal, ver R14
7. **ErrorMessages wording**: siempre tomar de IMPLEMENTATION-PLAN.md, ver R13
8. **Si un agente sugiere entidad Sale separada para POS** → está mal, ver R15
9. **Si un agente sugiere integración directa con SUNAT** → está mal, ver R17
10. **Si un agente sugiere unificar Customer + Staff en una tabla users** → está mal, ver R18
11. **Si un agente sugiere RolesGuard en lugar de SubjectTypeGuard + StaffRoleGuard** → está mal, ver R21
12. **Si un agente sugiere registro público para staff** → está mal, ver R20
13. **Si un agente sugiere POS como Orchestration sin entidades** → está mal, ver R23
14. **Si un agente sugiere seed en tabla users** → está mal, ver R24
