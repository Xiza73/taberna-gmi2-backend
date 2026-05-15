import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateStoreSettings1715100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id uuid PRIMARY KEY,
        store_name varchar(255) NOT NULL,
        legal_name varchar(255),
        address varchar(500),
        district varchar(100),
        city varchar(100),
        phone varchar(20),
        email varchar(255),
        ruc varchar(11),
        currency varchar(10) NOT NULL DEFAULT 'PEN',
        igv_percentage numeric(5,2) NOT NULL DEFAULT 18,
        logo_url varchar(500),
        favicon_url varchar(500),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_store_settings_id'
        ) THEN
          ALTER TABLE store_settings ADD CONSTRAINT uq_store_settings_id UNIQUE (id);
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_store_settings_igv_percentage'
        ) THEN
          ALTER TABLE store_settings ADD CONSTRAINT chk_store_settings_igv_percentage
            CHECK (igv_percentage BETWEEN 0 AND 100);
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE store_settings DROP CONSTRAINT IF EXISTS chk_store_settings_igv_percentage`,
    );
    await queryRunner.query(
      `ALTER TABLE store_settings DROP CONSTRAINT IF EXISTS uq_store_settings_id`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS store_settings`);
  }
}
