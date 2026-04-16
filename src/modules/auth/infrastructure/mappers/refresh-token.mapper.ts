import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { RefreshTokenOrmEntity } from '../orm-entities/refresh-token.orm-entity.js';

export class RefreshTokenMapper {
  static toDomain(orm: RefreshTokenOrmEntity): RefreshToken {
    return RefreshToken.reconstitute({
      id: orm.id,
      userId: orm.userId,
      tokenHash: orm.tokenHash,
      familyId: orm.familyId,
      expiresAt: orm.expiresAt,
      isRevoked: orm.isRevoked,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: RefreshToken): RefreshTokenOrmEntity {
    const orm = new RefreshTokenOrmEntity();
    orm.id = domain.id;
    orm.userId = domain.userId;
    orm.tokenHash = domain.tokenHash;
    orm.familyId = domain.familyId;
    orm.expiresAt = domain.expiresAt;
    orm.isRevoked = domain.isRevoked;
    return orm;
  }
}
