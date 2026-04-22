import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface';

import { type Address } from '../../domain/entities/address.entity';
import { type IAddressRepository } from '../../domain/interfaces/address-repository.interface';
import { AddressOrmEntity } from '../orm-entities/address.orm-entity';
import { AddressMapper } from '../mappers/address.mapper';

@Injectable()
export class AddressRepository implements IAddressRepository {
  constructor(
    @InjectRepository(AddressOrmEntity)
    private readonly repo: Repository<AddressOrmEntity>,
  ) {}

  async save(entity: Address): Promise<Address> {
    const orm = AddressMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return AddressMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Address | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? AddressMapper.toDomain(orm) : null;
  }

  async findAllByUserId(userId: string): Promise<Address[]> {
    const orms = await this.repo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
    return orms.map((orm) => AddressMapper.toDomain(orm));
  }

  async countByUserId(userId: string): Promise<number> {
    return this.repo.count({ where: { userId } });
  }

  async setDefault(addressId: string, userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(AddressOrmEntity)
      .set({ isDefault: () => `(id = :addressId)` })
      .where('user_id = :userId', { userId })
      .setParameter('addressId', addressId)
      .execute();
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(AddressOrmEntity);
    const clone = new AddressRepository(repo) as this;
    return clone;
  }
}
