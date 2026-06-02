# 18. Logging (Pino → stdout)

Request logging con **Pino** (JSON estructurado a stdout). **Sin Elasticsearch
ni Kibana**. Railway captura stdout gratis y permite búsqueda/filtro básico en
su dashboard. No es un modulo separado — se configura vía `nestjs-pino` en
`AppModule`. Health check se agrega en Phase 17.

**Implementacion NestJS:**
- `LoggerModule.forRootAsync` (de `nestjs-pino`) configurado en `AppModule` con
  los params de `src/config/logger.config.ts`.
- `main.ts` enruta todos los logs de Nest a Pino: `app.useLogger(app.get(Logger))`
  + `bufferLogs: true`.
- `autoLogging: true` → cada request se loguea automáticamente (reemplaza al
  viejo `LoggingMiddleware`).
- En dev: `pino-pretty` (legible). En prod: JSON crudo.

**Enriquecimiento por request** (`customProps` + serializers):
- `method`, `url` (saneada — se redactan query params sensibles: `token`,
  `refresh_token`, `code`, `password`)
- `statusCode`, `responseTime` (de pino-http)
- `userId` (de `req.user`)
- `ip` + geolocalización (`geoip-lite`): `city`, `region`, `country`, `location`
- **No** se loguean headers (evita filtrar `Authorization` / cookies)

**Log entry (ejemplo, prod):**
```json
{
  "level": 30,
  "time": 1718000000000,
  "req": { "id": 1, "method": "POST", "url": "/api/v1/orders" },
  "res": { "statusCode": 201 },
  "responseTime": 234,
  "userId": "uuid-or-null",
  "ip": "192.168.1.1",
  "city": "Lima", "region": "LIM", "country": "PE",
  "location": { "lat": -12.04, "lon": -77.04 },
  "msg": "request completed"
}
```

**Dónde ver los logs:**
- **Railway → servicio backend → Deployments / Logs** (gratis, búsqueda básica).
- **Opcional**: para dashboards tipo Kibana, conectar un **Log Drain** a Axiom /
  Better Stack desde Railway → Settings → Log Drains. **No requiere cambios de
  código** (los logs ya salen como JSON por stdout).

**Endpoints:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/health` | @Public | Health check (DB) |

**Health check**: `@nestjs/terminus` — verifica que PostgreSQL esté operativo.
</content>
