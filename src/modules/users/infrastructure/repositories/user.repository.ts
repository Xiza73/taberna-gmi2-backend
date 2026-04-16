import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { type User } from '../../domain/entities/user.entity.js';
import { type IUserRepository } from '../../domain/interfaces/user-repository.interface.js';
import { UserOrmEntity } from '../orm-entities/user.orm-entity.js';
import { UserMapper } from '../mappers/user.mapper.js';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async save(entity: User): Promise<User> {
    const orm = UserMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return UserMapper.toDomain(saved);
  }

  async findById(id: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { email: email.toLowerCase() } });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<{ items: User[]; total: number }> {
    const qb = this.repo.createQueryBuilder('u');

    if (params.search) {
      qb.andWhere('(u.name ILIKE :search OR u.email ILIKE :search)', {
        search: `%${params.search}%`,
      });
    }
    if (params.role) {
      qb.andWhere('u.role = :role', { role: params.role });
    }
    if (params.isActive !== undefined) {
      qb.andWhere('u.is_active = :isActive', { isActive: params.isActive });
    }

    qb.orderBy('u.created_at', 'DESC');
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [orms, total] = await qb.getManyAndCount();
    return { items: orms.map(UserMapper.toDomain), total };
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(UserOrmEntity);
    const clone = new UserRepository(repo) as this;
    return clone;
  }
}
