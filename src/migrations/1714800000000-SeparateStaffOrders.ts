import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class SeparateStaffOrders1714800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS staff_id UUID`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_staff'
        ) THEN
          ALTER TABLE orders
            ADD CONSTRAINT fk_orders_staff
            FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE RESTRICT;
        END IF;
      END $$
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_staff_id ON orders(staff_id)`,
    );

    await queryRunner.query(
      `ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_user_xor_staff'
        ) THEN
          ALTER TABLE orders ADD CONSTRAINT chk_orders_user_xor_staff CHECK (
            (user_id IS NOT NULL AND staff_id IS NULL)
            OR (user_id IS NULL AND staff_id IS NOT NULL)
          );
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_user_xor_staff`,
    );
    await queryRunner.query(
      `ALTER TABLE orders ALTER COLUMN user_id SET NOT NULL`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_staff_id`);
    await queryRunner.query(
      `ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_staff`,
    );
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN IF EXISTS staff_id`);
  }
}
