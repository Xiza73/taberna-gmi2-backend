# 19. Search (Full DDD, importado por ProductsModule en Phase 16)

Busqueda inteligente de productos con Elasticsearch. Tolerante a errores de tipeo, con sugerencias y relevancia.

**Endpoints — Public:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/search` | @Public | Buscar productos |
| GET | `/search/suggest` | @Public | Autocompletar mientras escribe |

**Endpoints — Admin:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/admin/search/reindex` | admin | Rebuild completo del indice ES |

**Query params**: `q` (texto), `categoryId`, `minPrice`, `maxPrice`, `sortBy`, `page`, `limit`

**Elasticsearch Index** `products`:
```json
{
  "mappings": {
    "properties": {
      "name": { "type": "text", "analyzer": "spanish", "fields": { "suggest": { "type": "search_as_you_type" } } },
      "description": { "type": "text", "analyzer": "spanish" },
      "categoryName": { "type": "keyword" },
      "price": { "type": "integer" },
      "isActive": { "type": "boolean" },
      "averageRating": { "type": "float" },
      "stock": { "type": "integer" }
    }
  }
}
```

**Capacidades de busqueda:**
| Feature | Como funciona |
|---------|---------------|
| **Fuzzy search** | `fuzziness: "AUTO"` — "zapatso" encuentra "zapatos", "camsia" encuentra "camisa" |
| **Analizador español** | Stemming: "corriendo"/"correr"/"corrió" son equivalentes |
| **Autocompletar** | `search_as_you_type` — sugerencias desde 2 caracteres |
| **Multi-campo** | Busca en name (peso x3) + description (peso x1) |
| **Filtros combinados** | Categoria + rango precio + stock > 0 + isActive = true |
| **Relevancia** | Score por match quality, boosteado por rating y ventas |

**Sincronizacion (sin dependencia circular):**
- `IProductSearchSync` interfaz + `PRODUCT_SEARCH_SYNC` token definidos en **ProductsModule domain**
- `SearchModule` (usa `forwardRef(() => ProductsModule)` para importar `PRODUCT_REPOSITORY`) implementa `IProductSearchSync` con `ElasticsearchProductSync` y exporta `PRODUCT_SEARCH_SYNC`.
- ProductsModule NO registra `PRODUCT_SEARCH_SYNC` localmente. Products use cases inyectan `@Optional() @Inject(PRODUCT_SEARCH_SYNC)` con null-check (`if (this.searchSync) await this.searchSync.indexProduct(...)`) — esto permite que Products funcione desde Phase 4 sin SearchModule (Phase 16). Cuando Search se agrega en Phase 16, ProductsModule lo importa directamente y el sync se activa.
- **Nota NestJS**: En NestJS, providers locales de un modulo siempre tienen precedencia sobre providers de modulos @Global. Por eso NO se usa `@Global` ni NullProductSearchSync fallback — se usa `@Optional()` + import directo.
- Rebuild completo via admin: `POST /admin/search/reindex`

**Fallback**: Si Elasticsearch esta caido, la busqueda cae a `pg_trgm` como fallback (query directa a PostgreSQL via `PRODUCT_REPOSITORY`).
