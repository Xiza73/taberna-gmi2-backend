import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddPaymentChannelConstraints1715000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_payment_method`,
    );
    await queryRunner.query(`
      ALTER TABLE orders ADD CONSTRAINT chk_orders_payment_method CHECK (
        payment_method IN ('mercadopago', 'cash', 'yape_plin', 'bank_transfer')
      )
    `);

    await queryRunner.query(
      `ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_channel`,
    );
    await queryRunner.query(`
      ALTER TABLE orders ADD CONSTRAINT chk_orders_channel CHECK (
        channel IN ('online', 'pos', 'whatsapp')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_channel`,
    );
    await queryRunner.query(
      `ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_payment_method`,
    );
  }
}
