import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BannerPosition } from '../../domain/enums/banner-position.enum.js';

@Entity('banners')
export class BannerOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, name: 'image_url' })
  imageUrl: string;

  @Column({ type: 'varchar', length: 500, name: 'link_url', nullable: true })
  linkUrl: string | null;

  @Column({ type: 'enum', enum: BannerPosition })
  position: BannerPosition;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'integer', name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ type: 'timestamptz', name: 'start_date', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamptz', name: 'end_date', nullable: true })
  endDate: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
