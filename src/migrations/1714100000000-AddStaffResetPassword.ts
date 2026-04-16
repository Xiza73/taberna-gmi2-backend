import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddStaffResetPassword1714100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE staff_members
      ADD COLUMN reset_password_token VARCHAR(255),
      ADD COLUMN reset_password_expires TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE staff_members
      DROP COLUMN reset_password_expires,
      DROP COLUMN reset_password_token
    `);
  }
}
