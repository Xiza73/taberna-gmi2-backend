import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

import { type CashMovement } from '../../domain/entities/cash-movement.entity';
import { type ICashMovementRepository } from '../../domain/interfaces/cash-movement-repository.interface';
import { CashMovementOrmEntity } from '../orm-entities/cash-movement.orm-entity';
import { CashMovementMapper } from '../mappers/cash-movement.mapper';

@Injectable()
export class CashMovementRepository implements ICashMovementRepository {
  constructor(
    @InjectRepository(CashMovementOrmEntity)
    private readonly repository: Repository<CashMovementOrmEntity>,
  ) {}

  async findByCashRegister(cashRegisterId: string): Promise<CashMovement[]> {
    const orms = await this.repository.find({
      where: { cashRegisterId },
      order: { createdAt: 'ASC' },
    });
    return orms.map((orm) => CashMovementMapper.toDomain(orm));
  }

  async save(entity: CashMovement): Promise<CashMovement> {
    const orm = CashMovementMapper.toOrm(entity);
    const saved = await this.repository.save(orm);
    return CashMovementMapper.toDomain(saved);
  }
}
