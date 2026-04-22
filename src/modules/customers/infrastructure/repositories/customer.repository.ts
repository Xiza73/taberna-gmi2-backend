import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface';

import { type Customer } from '../../domain/entities/customer.entity';
import { type ICustomerRepository } from '../../domain/interfaces/customer-repository.interface';
import { CustomerOrmEntity } from '../orm-entities/customer.orm-entity';
import { CustomerMapper } from '../mappers/customer.mapper';

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly repo: Repository<CustomerOrmEntity>,
  ) {}

  async save(entity: Customer): Promise<Customer> {
    const orm = CustomerMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return CustomerMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Customer | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? CustomerMapper.toDomain(orm) : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const orm = await this.repo.findOne({
      where: { email: email.toLowerCase() },
    });
    return orm ? CustomerMapper.toDomain(orm) : null;
  }

  async findByGoogleId(googleId: string): Promise<Customer | null> {
    const orm = await this.repo.findOne({ where: { googleId } });
    return orm ? CustomerMapper.toDomain(orm) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: Customer[]; total: number }> {
    const qb = this.repo.createQueryBuilder('u');

    if (params.search) {
      qb.andWhere('(u.name ILIKE :search OR u.email ILIKE :search)', {
        search: `%${params.search}%`,
      });
    }
    if (params.isActive !== undefined) {
      qb.andWhere('u.is_active = :isActive', { isActive: params.isActive });
    }

    qb.orderBy('u.created_at', 'DESC');
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [orms, total] = await qb.getManyAndCount();
    return { items: orms.map((orm) => CustomerMapper.toDomain(orm)), total };
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(CustomerOrmEntity);
    const clone = new CustomerRepository(repo) as this;
    return clone;
  }
}
