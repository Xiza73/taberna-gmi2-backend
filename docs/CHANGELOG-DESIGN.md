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

---

## Notas para Revisores Futuros

1. **NO revertir ninguna regla R1-R14** sin entender el "Por qué"
2. **Si un agente sugiere @Global para SearchModule** → está mal, ver R3
3. **Si un agente sugiere @SkipThrottle para webhooks** → está mal, ver R4
4. **Si un agente sugiere @UseGuards(RolesGuard) en admin** → está mal, ver R6
5. **Si un agente sugiere useClass para JwtAuthGuard** → está mal, ver R12
6. **Si un agente sugiere NullProductSearchSync** → está mal, ver R14
7. **ErrorMessages wording**: siempre tomar de IMPLEMENTATION-PLAN.md, ver R13
