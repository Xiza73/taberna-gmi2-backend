import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddOrderPaymentShippingDocFields1714500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
          CREATE TYPE payment_method_enum AS ENUM ('mercadopago', 'cash', 'yape_plin', 'bank_transfer');
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipping_method_enum') THEN
          CREATE TYPE shipping_method_enum AS ENUM ('standard', 'express', 'pickup');
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_doc_type_enum') THEN
          CREATE TYPE customer_doc_type_enum AS ENUM ('dni', 'ruc');
        END IF;
      END $$
    `);

    await queryRunner.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS payment_method payment_method_enum NOT NULL DEFAULT 'mercadopago',
        ADD COLUMN IF NOT EXISTS shipping_method shipping_method_enum NOT NULL DEFAULT 'standard',
        ADD COLUMN IF NOT EXISTS customer_doc_type customer_doc_type_enum,
        ADD COLUMN IF NOT EXISTS customer_doc_number VARCHAR(11)
    `);

    await queryRunner.query(`
      ALTER TABLE orders ADD CONSTRAINT chk_orders_doc_number
      CHECK (
        (customer_doc_type IS NULL AND customer_doc_number IS NULL)
        OR (customer_doc_type = 'dni' AND customer_doc_number ~ '^[0-9]{8}$')
        OR (customer_doc_type = 'ruc' AND customer_doc_number ~ '^[0-9]{11}$')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_doc_number`,
    );
    await queryRunner.query(
      `ALTER TABLE orders DROP COLUMN IF EXISTS customer_doc_number`,
    );
    await queryRunner.query(
      `ALTER TABLE orders DROP COLUMN IF EXISTS customer_doc_type`,
    );
    await queryRunner.query(
      `ALTER TABLE orders DROP COLUMN IF EXISTS shipping_method`,
    );
    await queryRunner.query(
      `ALTER TABLE orders DROP COLUMN IF EXISTS payment_method`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS customer_doc_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS shipping_method_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_method_enum`);
  }
}
