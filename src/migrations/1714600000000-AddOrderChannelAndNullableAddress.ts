import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddOrderChannelAndNullableAddress1714600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_channel_enum') THEN
          CREATE TYPE order_channel_enum AS ENUM ('online', 'pos', 'whatsapp');
        END IF;
      END $$
    `);

    await queryRunner.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS channel order_channel_enum NOT NULL DEFAULT 'online'
    `);

    await queryRunner.query(`
      ALTER TABLE orders
        ALTER COLUMN shipping_address_snapshot DROP NOT NULL
    `);

    await queryRunner.query(
      `ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_shipping_address`,
    );

    await queryRunner.query(`
      ALTER TABLE orders ADD CONSTRAINT chk_orders_online_address CHECK (
        channel <> 'online'
        OR (
          shipping_address_snapshot IS NOT NULL
          AND shipping_address_snapshot ? 'street'
          AND shipping_address_snapshot ? 'city'
          AND shipping_address_snapshot ? 'department'
          AND shipping_address_snapshot ? 'recipientName'
        )
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_channel`);
    await queryRunner.query(
      `ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_online_address`,
    );
    await queryRunner.query(`
      ALTER TABLE orders ADD CONSTRAINT chk_orders_shipping_address CHECK (
        shipping_address_snapshot ? 'street' AND shipping_address_snapshot ? 'city'
        AND shipping_address_snapshot ? 'department' AND shipping_address_snapshot ? 'recipientName'
      )
    `);
    await queryRunner.query(
      `ALTER TABLE orders ALTER COLUMN shipping_address_snapshot SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN IF EXISTS channel`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_channel_enum`);
  }
}
