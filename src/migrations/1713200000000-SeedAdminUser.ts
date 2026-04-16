import { type MigrationInterface, type QueryRunner } from 'typeorm';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

export class SeedAdminUser1713200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const id = randomUUID();
    const password = await hash('Admin123!', 12);

    await queryRunner.query(
      `INSERT INTO users (id, name, email, password, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [id, 'Admin', 'admin@tienda.com', password, 'admin', true],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM users WHERE email = 'admin@tienda.com'`,
    );
  }
}
