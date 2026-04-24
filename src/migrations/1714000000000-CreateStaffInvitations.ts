import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateStaffInvitations1714000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS staff_invitations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        token_hash VARCHAR(255) NOT NULL,
        invited_by UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        accepted_at TIMESTAMPTZ,
        is_revoked BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_staff_invitations_email ON staff_invitations(email)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_staff_invitations_pending ON staff_invitations(email, is_revoked, accepted_at, expires_at)
      WHERE is_revoked = false AND accepted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS staff_invitations`);
  }
}
