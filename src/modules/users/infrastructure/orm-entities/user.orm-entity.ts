import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 20, default: 'customer' })
  role: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'reset_password_token',
    nullable: true,
  })
  resetPasswordToken: string | null;

  @Column({
    type: 'timestamptz',
    name: 'reset_password_expires',
    nullable: true,
  })
  resetPasswordExpires: Date | null;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'google_id',
    nullable: true,
    unique: true,
  })
  googleId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
