import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface';

import { type Coupon } from '../entities/coupon.entity';

export const COUPON_REPOSITORY = Symbol('COUPON_REPOSITORY');

export interface ICouponRepository extends IBaseRepository<Coupon> {
  findByCode(code: string): Promise<Coupon | null>;
  codeExists(code: string, excludeId?: string): Promise<boolean>;
  findAll(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
    type?: string;
  }): Promise<{ items: Coupon[]; total: number }>;
  findActive(params: {
    page: number;
    limit: number;
  }): Promise<{ items: Coupon[]; total: number }>;
  findByIdForUpdate(id: string): Promise<Coupon | null>;
  incrementUses(id: string): Promise<boolean>;
  decrementUses(id: string): Promise<void>;
}
