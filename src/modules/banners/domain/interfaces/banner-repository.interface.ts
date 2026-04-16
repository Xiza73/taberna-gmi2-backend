import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface.js';

import { type Banner } from '../entities/banner.entity.js';

export const BANNER_REPOSITORY = Symbol('BANNER_REPOSITORY');

export interface IBannerRepository extends IBaseRepository<Banner> {
  findAllActive(): Promise<Banner[]>;
  findAll(params: {
    page: number;
    limit: number;
    includeInactive?: boolean;
  }): Promise<{ items: Banner[]; total: number }>;
}
