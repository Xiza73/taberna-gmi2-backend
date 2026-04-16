import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CustomerOrmEntity } from '@modules/customers/infrastructure/orm-entities/customer.orm-entity.js';

import { CartItemOrmEntity } from './cart-item.orm-entity.js';

@Entity('carts')
export class CartOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  @Index('idx_carts_user_id', { unique: true })
  userId: string;

  @OneToOne(() => CustomerOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  customer?: CustomerOrmEntity;

  @OneToMany(() => CartItemOrmEntity, (item) => item.cart, { cascade: true })
  items?: CartItemOrmEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
