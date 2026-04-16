import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, type Repository } from 'typeorm';

import { type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { type Shipment } from '../../domain/entities/shipment.entity.js';
import { type IShipmentRepository } from '../../domain/interfaces/shipment-repository.interface.js';
import { ShipmentOrmEntity } from '../orm-entities/shipment.orm-entity.js';
import { ShipmentMapper } from '../mappers/shipment.mapper.js';

@Injectable()
export class ShipmentRepository implements IShipmentRepository {
  constructor(
    @InjectRepository(ShipmentOrmEntity)
    private readonly repo: Repository<ShipmentOrmEntity>,
  ) {}

  async save(entity: Shipment): Promise<Shipment> {
    const orm = ShipmentMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return ShipmentMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Shipment | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? ShipmentMapper.toDomain(orm) : null;
  }

  async findByOrderId(orderId: string): Promise<Shipment | null> {
    const orm = await this.repo.findOne({ where: { orderId } });
    return orm ? ShipmentMapper.toDomain(orm) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  withTransaction(ctx: TransactionContext): this {
    const manager = ctx as EntityManager;
    const repo = manager.getRepository(ShipmentOrmEntity);
    const clone = new ShipmentRepository(repo) as this;
    return clone;
  }
}
