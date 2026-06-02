# 19. Search (Full DDD, importado por ProductsModule en Phase 16)

Busqueda inteligente de productos con **PostgreSQL** (`tsvector` + `pg_trgm`).
Tolerante a errores de tipeo, con sugerencias y relevancia. **Sin Elasticsearch**
— cero infra extra, corre sobre el mismo Postgres que ya paga el proyecto.

**Endpoints — Public:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/search` | @Public | Buscar productos |
| GET | `/search/suggest` | @Public | Autocompletar mientras escribe |

**Query params**: `q` (texto), `categoryId`, `minPrice`, `maxPrice`, `sortBy`, `page`, `limit`

**Indexado (columna `search_vector` mantenida por trigger, sin sync manual):**
La tabla `products` tiene una columna `search_vector tsvector` que un trigger
`BEFORE INSERT OR UPDATE` recalcula automáticamente a partir de:
(no se usa columna `GENERATED` porque `array_to_string` es STABLE y Postgres
la rechaza en expresiones generadas — "generation expression is not immutable")

```
setweight(to_tsvector('spanish', name),               'A') ||  -- nombre (peso alto)
setweight(to_tsvector('spanish', synonyms juntos),    'B') ||  -- sinónimos por producto
setweight(to_tsvector('spanish', description),        'C')     -- descripción
```

Índices: GIN sobre `search_vector` (full-text) + GIN `gin_trgm_ops` sobre `name`
(typos/autocomplete). No hay reindex ni job de sincronización: el trigger
mantiene el vector consistente al guardar el producto.

**Capacidades de busqueda:**
| Feature | Como funciona |
|---------|---------------|
| **Fuzzy / typos** | `pg_trgm` `similarity(name, q) > 0.2` — "sapato"/"zapto" encuentran "zapato" |
| **Analizador español** | `to_tsvector('spanish', ...)` — stemming y stopwords ("corriendo"≈"correr"), acentos normalizados |
| **Sinónimos por producto** | Campo `synonyms text[]` editable en el backoffice; buscar un sinónimo (ej. "calzado") encuentra el producto |
| **Autocompletar** | Prefijo `ILIKE q%` + similitud trigram, ordenado por similitud |
| **Multi-campo** | name (peso A) + synonyms (peso B) + description (peso C) |
| **Filtros combinados** | Categoria + rango precio + stock > 0 + isActive = true |
| **Relevancia** | `ts_rank` del match full-text, desempate por similitud del nombre |

**Implementación:**
- `IProductSearchService` (token `PRODUCT_SEARCH`) implementado por
  `PostgresProductSearch`, que ejecuta SQL crudo vía el `DataSource` de TypeORM
  (join a `categories` para el `categoryName`).
- `SearchModule` importa `ProductsModule` (sin `forwardRef` — ya no hay
  dependencia circular) para acceder a `PRODUCT_REPOSITORY` en el fallback.
- **Ya no existe** `IProductSearchSync` / `PRODUCT_SEARCH_SYNC` ni el endpoint
  `POST /admin/search/reindex`: el trigger vuelve innecesaria toda
  sincronización a nivel de aplicación.

**Fallback**: Si la query full-text falla por cualquier motivo, la búsqueda cae
a una consulta básica de repositorio (`PRODUCT_REPOSITORY.findAll`).
