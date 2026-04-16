import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface.js';

import { type RefreshToken } from '../entities/refresh-token.entity.js';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface IRefreshTokenRepository extends IBaseRepository<RefreshToken> {
  revokeByFamily(familyId: string): Promise<void>;
  revokeAllByUser(userId: string): Promise<void>;
  deleteExpiredAndRevoked(): Promise<number>;
}
