import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenOrmEntity } from '../orm-entities/refresh-token.orm-entity';

export class RefreshTokenMapper {
  static toDomain(orm: RefreshTokenOrmEntity): RefreshToken {
    return RefreshToken.reconstitute({
      id: orm.id,
      userId: orm.userId,
      tokenHash: orm.tokenHash,
      familyId: orm.familyId,
      expiresAt: orm.expiresAt,
      isRevoked: orm.isRevoked,
      subjectType: (orm.subjectType as 'customer' | 'staff') ?? 'customer',
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
    orm.subjectType = domain.subjectType;
    return orm;
  }
}
