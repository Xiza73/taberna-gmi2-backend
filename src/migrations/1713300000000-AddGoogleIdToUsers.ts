import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddGoogleIdToUsers1713300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_google_id`);
    await queryRunner.query(
      `ALTER TABLE users DROP COLUMN IF EXISTS google_id`,
    );
  }
}
