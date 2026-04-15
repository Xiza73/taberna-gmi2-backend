# 18. Logging (Middleware en SharedModule)

Request logging con Elasticsearch + Kibana para monitoreo y debugging. No es un modulo separado — se implementa como middleware en SharedModule. Health check se agrega en Phase 17.

**Componentes Docker:**
- **Elasticsearch**: almacena logs y indice de productos (search)
- **Kibana**: dashboards de visualizacion (puerto 5601)

**Implementacion NestJS:**
- `LoggingMiddleware`: logea cada request (method, path, status, duration, userId, ip)
- Envia logs a Elasticsearch via `@nestjs/elasticsearch`
- Index pattern: `ecommerce-logs-YYYY.MM.DD`

**Log entry shape:**
```json
{
  "timestamp": "2026-04-14T10:30:00Z",
  "method": "POST",
  "path": "/api/v1/orders",
  "statusCode": 201,
  "duration": 234,
  "userId": "uuid-or-null",
  "ip": "192.168.1.1",
  "userAgent": "...",
  "error": null
}
```

**Endpoints:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/health` | @Public | Health check (DB + Elasticsearch) |

**Health check**: `@nestjs/terminus` — verifica PostgreSQL y Elasticsearch estan operativos.
