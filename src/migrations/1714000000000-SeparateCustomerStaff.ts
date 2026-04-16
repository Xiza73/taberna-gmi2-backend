import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class SeparateCustomerStaff1714000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. Create staff_members table ─────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS staff_members (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // ─── 2. Copy admin users to staff_members (preserve UUIDs) ────
    await queryRunner.query(`
      INSERT INTO staff_members (id, name, email, password, is_active, created_at, updated_at)
      SELECT id, name, email, password, is_active, created_at, updated_at
      FROM users
      WHERE role = 'admin'
    `);

    // ─── 3. Add subject_type column to refresh_tokens ──────────────
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
      ADD COLUMN IF NOT EXISTS subject_type VARCHAR(20) NOT NULL DEFAULT 'customer'
    `);

    // ─── 4. Update refresh_tokens for admin users to 'staff' ──────
    await queryRunner.query(`
      UPDATE refresh_tokens
      SET subject_type = 'staff'
      WHERE user_id IN (SELECT id FROM users WHERE role = 'admin')
    `);

    // ─── 5. Drop FK on order_events.performed_by → users ──────────
    await queryRunner.query(`
      ALTER TABLE order_events
      DROP CONSTRAINT IF EXISTS fk_order_events_performed_by
    `);

    // ─── 6. Drop FK on refresh_tokens.user_id → users ─────────────
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
      DROP CONSTRAINT IF EXISTS fk_refresh_tokens_user
    `);

    // ─── 7. Delete admin users from users table ────────────────────
    await queryRunner.query(`
      DELETE FROM users WHERE role = 'admin'
    `);

    // ─── 8. Rename users → customers ──────────────────────────────
    await queryRunner.query(`
      ALTER TABLE users RENAME TO customers
    `);

    // ─── 9. Drop role column from customers ───────────────────────
    await queryRunner.query(`
      ALTER TABLE customers DROP COLUMN IF EXISTS role
    `);

    // ─── 10. Recreate FK: refresh_tokens.user_id (no FK constraint — polymorphic, enforced in app layer) ──

    // ─── 11. Add FK: order_events.performed_by → staff_members ────
    await queryRunner.query(`
      ALTER TABLE order_events
      ADD CONSTRAINT fk_order_events_performed_by
      FOREIGN KEY (performed_by) REFERENCES staff_members(id) ON DELETE SET NULL
    `);

    // ─── 12. Rename index on users → customers ───────────────────
    await queryRunner.query(`
      ALTER INDEX IF EXISTS idx_refresh_tokens_user_id RENAME TO idx_refresh_tokens_subject_id
    `);
    await queryRunner.query(`
      ALTER INDEX IF EXISTS idx_refresh_tokens_active RENAME TO idx_refresh_tokens_subject_active
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ─── Reverse index renames ──────────────────────────────────────
    await queryRunner.query(`
      ALTER INDEX IF EXISTS idx_refresh_tokens_subject_id RENAME TO idx_refresh_tokens_user_id
    `);
    await queryRunner.query(`
      ALTER INDEX IF EXISTS idx_refresh_tokens_subject_active RENAME TO idx_refresh_tokens_active
    `);

    // ─── Drop FK: order_events → staff_members ─────────────────────
    await queryRunner.query(`
      ALTER TABLE order_events
      DROP CONSTRAINT IF EXISTS fk_order_events_performed_by
    `);

    // ─── Add role column back ──────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE customers
      ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'customer'
    `);

    // ─── Rename customers → users ──────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE customers RENAME TO users
    `);

    // ─── Copy staff_members back to users as admins ────────────────
    await queryRunner.query(`
      INSERT INTO users (id, name, email, password, role, is_active, created_at, updated_at)
      SELECT id, name, email, password, 'admin', is_active, created_at, updated_at
      FROM staff_members
    `);

    // ─── Recreate FK: refresh_tokens → users ───────────────────────
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
      ADD CONSTRAINT fk_refresh_tokens_user
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `);

    // ─── Recreate FK: order_events → users ─────────────────────────
    await queryRunner.query(`
      ALTER TABLE order_events
      ADD CONSTRAINT fk_order_events_performed_by
      FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
    `);

    // ─── Drop subject_type column ──────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS subject_type
    `);

    // ─── Drop staff_members table ──────────────────────────────────
    await queryRunner.query(`DROP TABLE IF EXISTS staff_members CASCADE`);
  }
}
