import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface';

import {
  STORE_SETTINGS_SINGLETON_ID,
  type StoreSettings,
} from '../../domain/entities/store-settings.entity';
import { type IStoreSettingsRepository } from '../../domain/interfaces/store-settings-repository.interface';
import { StoreSettingsOrmEntity } from '../orm-entities/store-settings.orm-entity';
import { StoreSettingsMapper } from '../mappers/store-settings.mapper';

@Injectable()
export class StoreSettingsRepository implements IStoreSettingsRepository {
  constructor(
    @InjectRepository(StoreSettingsOrmEntity)
    private readonly repo: Repository<StoreSettingsOrmEntity>,
  ) {}

  async save(entity: StoreSettings): Promise<StoreSettings> {
    const orm = StoreSettingsMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return StoreSettingsMapper.toDomain(saved);
  }

  async findById(id: string): Promise<StoreSettings | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? StoreSettingsMapper.toDomain(orm) : null;
  }

  async findSingleton(): Promise<StoreSettings | null> {
    return this.findById(STORE_SETTINGS_SINGLETON_ID);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(StoreSettingsOrmEntity);
    const clone = new StoreSettingsRepository(repo) as this;
    return clone;
  }
}
