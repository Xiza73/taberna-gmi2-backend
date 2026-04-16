import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { type StaffMember } from '../../domain/entities/staff-member.entity.js';
import { type IStaffMemberRepository } from '../../domain/interfaces/staff-member-repository.interface.js';
import { StaffMemberOrmEntity } from '../orm-entities/staff-member.orm-entity.js';
import { StaffMemberMapper } from '../mappers/staff-member.mapper.js';

@Injectable()
export class StaffMemberRepository implements IStaffMemberRepository {
  constructor(
    @InjectRepository(StaffMemberOrmEntity)
    private readonly repo: Repository<StaffMemberOrmEntity>,
  ) {}

  async save(entity: StaffMember): Promise<StaffMember> {
    const orm = StaffMemberMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return StaffMemberMapper.toDomain(saved);
  }

  async findById(id: string): Promise<StaffMember | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? StaffMemberMapper.toDomain(orm) : null;
  }

  async findByEmail(email: string): Promise<StaffMember | null> {
    const orm = await this.repo.findOne({
      where: { email: email.toLowerCase() },
    });
    return orm ? StaffMemberMapper.toDomain(orm) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: StaffMember[]; total: number }> {
    const qb = this.repo.createQueryBuilder('s');

    if (params.search) {
      qb.andWhere('(s.name ILIKE :search OR s.email ILIKE :search)', {
        search: `%${params.search}%`,
      });
    }
    if (params.isActive !== undefined) {
      qb.andWhere('s.is_active = :isActive', { isActive: params.isActive });
    }

    qb.orderBy('s.created_at', 'DESC');
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [orms, total] = await qb.getManyAndCount();
    return { items: orms.map((orm) => StaffMemberMapper.toDomain(orm)), total };
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(StaffMemberOrmEntity);
    const clone = new StaffMemberRepository(repo) as this;
    return clone;
  }
}
