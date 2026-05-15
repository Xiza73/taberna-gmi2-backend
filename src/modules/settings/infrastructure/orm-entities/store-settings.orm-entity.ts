import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('store_settings')
export class StoreSettingsOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'store_name' })
  storeName: string;

  @Column({ type: 'varchar', length: 255, name: 'legal_name', nullable: true })
  legalName: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  ruc: string | null;

  @Column({ type: 'varchar', length: 10, default: 'PEN' })
  currency: string;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    name: 'igv_percentage',
    default: 18,
    transformer: {
      to: (value: number): number => value,
      from: (value: string | number | null): number =>
        value === null || value === undefined
          ? 0
          : typeof value === 'number'
            ? value
            : parseFloat(value),
    },
  })
  igvPercentage: number;

  @Column({ type: 'varchar', length: 500, name: 'logo_url', nullable: true })
  logoUrl: string | null;

  @Column({ type: 'varchar', length: 500, name: 'favicon_url', nullable: true })
  faviconUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
