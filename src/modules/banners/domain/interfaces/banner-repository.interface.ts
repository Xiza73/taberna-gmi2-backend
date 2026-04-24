import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface';

import { type Banner } from '../entities/banner.entity';

export const BANNER_REPOSITORY = Symbol('BANNER_REPOSITORY');

export interface IBannerRepository extends IBaseRepository<Banner> {
  findAllActive(): Promise<Banner[]>;
  findAll(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
    position?: string;
  }): Promise<{ items: Banner[]; total: number }>;
}
