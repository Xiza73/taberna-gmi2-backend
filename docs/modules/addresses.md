# 8. Addresses

Direcciones de envio del customer.

**Entity**: `Address`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| userId | uuid | FK → users |
| label | string | "Casa", "Oficina", etc |
| recipientName | string | nombre de quien recibe |
| phone | string | telefono de contacto |
| street | string | direccion completa |
| district | string | distrito |
| city | string | ciudad |
| department | string | departamento (Lima, Arequipa, etc) |
| zipCode | string? | codigo postal |
| reference | string? | referencia adicional |
| isDefault | boolean | default false |

**Endpoints:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/addresses` | JWT | Listar mis direcciones |
| POST | `/addresses` | JWT | Crear direccion |
| PATCH | `/addresses/:id` | JWT | Editar direccion |
| DELETE | `/addresses/:id` | JWT | Eliminar direccion |
| POST | `/addresses/:id/default` | JWT | Marcar como default |

**Use Cases**: `ListAddressesUseCase`, `CreateAddressUseCase`, `UpdateAddressUseCase`, `DeleteAddressUseCase`, `SetDefaultAddressUseCase`

**Reglas:**
- **Ownership**: Todas las operaciones verifican `address.userId === authenticatedUserId`. Throw `ADDRESS_NOT_OWNED` si no coincide
- **Max 10 direcciones** por usuario. Throw `ADDRESS_LIMIT_REACHED` si se excede
- **SetDefault**: Ejecutar en una sola query: `UPDATE addresses SET is_default = (id = :addressId) WHERE user_id = :userId`
