import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { type RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { type IRefreshTokenRepository } from '../../domain/interfaces/refresh-token-repository.interface.js';
import { RefreshTokenOrmEntity } from '../orm-entities/refresh-token.orm-entity.js';
import { RefreshTokenMapper } from '../mappers/refresh-token.mapper.js';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repo: Repository<RefreshTokenOrmEntity>,
  ) {}

  async save(entity: RefreshToken): Promise<RefreshToken> {
    const orm = RefreshTokenMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return RefreshTokenMapper.toDomain(saved);
  }

  async findById(id: string): Promise<RefreshToken | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? RefreshTokenMapper.toDomain(orm) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async revokeByFamily(familyId: string): Promise<void> {
    await this.repo.update({ familyId }, { isRevoked: true });
  }

  async revokeAllByUser(userId: string): Promise<void> {
    await this.repo.update({ userId }, { isRevoked: true });
  }

  async deleteExpiredAndRevoked(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where("is_revoked = true OR expires_at < NOW() - INTERVAL '7 days'")
      .execute();
    return result.affected ?? 0;
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(RefreshTokenOrmEntity);
    const clone = new RefreshTokenRepository(repo) as this;
    return clone;
  }
}
