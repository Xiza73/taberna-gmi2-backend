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

    // Columna tsvector mantenida por TRIGGER (no GENERATED): la expresión
    // usa array_to_string(), que Postgres marca STABLE (no IMMUTABLE) y por
    // eso rechaza en una columna GENERATED ("generation expression is not
    // immutable"). Un trigger BEFORE no tiene esa restricción.
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS search_vector tsvector
    `);

    // Arma el vector: nombre (peso A) + sinónimos (B) + descripción (C).
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION products_search_vector_update()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') ||
          setweight(to_tsvector('spanish', coalesce(array_to_string(NEW.synonyms, ' '), '')), 'B') ||
          setweight(to_tsvector('spanish', coalesce(NEW.description, '')), 'C');
        RETURN NEW;
      END;
      $$
    `);

    // Recalcula cuando cambia nombre, descripción o sinónimos.
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS products_search_vector_trigger ON products`,
    );
    await queryRunner.query(`
      CREATE TRIGGER products_search_vector_trigger
      BEFORE INSERT OR UPDATE OF name, description, synonyms ON products
      FOR EACH ROW EXECUTE FUNCTION products_search_vector_update()
    `);

    // Backfill de filas existentes (el trigger solo corre en cambios futuros).
    await queryRunner.query(`
      UPDATE products SET search_vector =
        setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce(array_to_string(synonyms, ' '), '')), 'B') ||
        setweight(to_tsvector('spanish', coalesce(description, '')), 'C')
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
      `DROP TRIGGER IF EXISTS products_search_vector_trigger ON products`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS products_search_vector_update()`,
    );
    await queryRunner.query(
      `ALTER TABLE products DROP COLUMN IF EXISTS search_vector`,
    );
    await queryRunner.query(
      `ALTER TABLE products DROP COLUMN IF EXISTS synonyms`,
    );
  }
}
