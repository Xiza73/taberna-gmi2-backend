import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, MoreThan, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface';

import { type StaffInvitation } from '../../domain/entities/staff-invitation.entity';
import { type IStaffInvitationRepository } from '../../domain/interfaces/staff-invitation-repository.interface';
import { StaffInvitationOrmEntity } from '../orm-entities/staff-invitation.orm-entity';
import { StaffInvitationMapper } from '../mappers/staff-invitation.mapper';

@Injectable()
export class StaffInvitationRepository implements IStaffInvitationRepository {
  constructor(
    @InjectRepository(StaffInvitationOrmEntity)
    private readonly repo: Repository<StaffInvitationOrmEntity>,
  ) {}

  async save(entity: StaffInvitation): Promise<StaffInvitation> {
    const orm = StaffInvitationMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return StaffInvitationMapper.toDomain(saved);
  }

  async findById(id: string): Promise<StaffInvitation | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? StaffInvitationMapper.toDomain(orm) : null;
  }

  async findPendingByEmail(email: string): Promise<StaffInvitation | null> {
    const orm = await this.repo.findOne({
      where: {
        email: email.toLowerCase(),
        isRevoked: false,
        acceptedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
    return orm ? StaffInvitationMapper.toDomain(orm) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findAll(params: {
    page: number;
    limit: number;
  }): Promise<{ items: StaffInvitation[]; total: number }> {
    const [orms, total] = await this.repo.findAndCount({
      where: {
        isRevoked: false,
        acceptedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
    return {
      items: orms.map((orm) => StaffInvitationMapper.toDomain(orm)),
      total,
    };
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(StaffInvitationOrmEntity);
    const clone = new StaffInvitationRepository(repo) as this;
    return clone;
  }
}
