import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddProductSearchVectorAndSynonyms1715200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // pg_trgm ya se crea en InitialSchema, pero lo reaseguramos para que
    // los índices trigram de typo-tolerance funcionen siempre.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    // Sinónimos / palabras relacionadas por producto (editables desde el
    // backoffice). Alimentan el search_vector con peso B.
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS synonyms text[] NOT NULL DEFAULT '{}'
    `);

    // Columna generada STORED: Postgres la recalcula sola en cada
    // INSERT/UPDATE a partir de name + synonyms + description. Cero sync
    // manual, búsqueda siempre consistente. La expresión es 100% IMMUTABLE
    // (to_tsvector con config constante 'spanish', setweight, array_to_string).
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS search_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('spanish', array_to_string(synonyms, ' ')), 'B') ||
        setweight(to_tsvector('spanish', coalesce(description, '')), 'C')
      ) STORED
    `);

    // GIN sobre el tsvector → full-text rápido.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_search_vector
      ON products USING gin (search_vector)
    `);

    // GIN trigram sobre name → tolerancia a typos y autocomplete.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_name_trgm
      ON products USING gin (name gin_trgm_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_name_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_search_vector`);
    await queryRunner.query(
      `ALTER TABLE products DROP COLUMN IF EXISTS search_vector`,
    );
    await queryRunner.query(
      `ALTER TABLE products DROP COLUMN IF EXISTS synonyms`,
    );
  }
}
