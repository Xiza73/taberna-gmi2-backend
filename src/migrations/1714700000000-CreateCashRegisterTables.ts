import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateCashRegisterTables1714700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cash_registers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        staff_id UUID NOT NULL,
        opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        closed_at TIMESTAMPTZ,
        initial_amount INTEGER NOT NULL,
        closing_amount INTEGER,
        expected_amount INTEGER,
        difference INTEGER,
        status VARCHAR(20) NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_cash_registers_status CHECK (status IN ('open', 'closed')),
        CONSTRAINT fk_cash_registers_staff FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_cash_registers_staff_id ON cash_registers(staff_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON cash_registers(status)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_cash_register_per_staff ON cash_registers(staff_id) WHERE status = 'open'`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cash_movements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cash_register_id UUID NOT NULL,
        staff_id UUID NOT NULL,
        type VARCHAR(20) NOT NULL,
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_cash_movements_type CHECK (type IN ('cash_in', 'cash_out')),
        CONSTRAINT chk_cash_movements_amount CHECK (amount > 0),
        CONSTRAINT fk_cash_movements_cash_register FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE CASCADE,
        CONSTRAINT fk_cash_movements_staff FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_cash_movements_cash_register_id ON cash_movements(cash_register_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_cash_movements_cash_register_id`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS cash_movements`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS uniq_open_cash_register_per_staff`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cash_registers_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cash_registers_staff_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS cash_registers`);
  }
}
