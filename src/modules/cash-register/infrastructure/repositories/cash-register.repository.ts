import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

import { type CashRegister } from '../../domain/entities/cash-register.entity';
import { CashRegisterStatus } from '../../domain/enums/cash-register-status.enum';
import { type ICashRegisterRepository } from '../../domain/interfaces/cash-register-repository.interface';
import { CashRegisterOrmEntity } from '../orm-entities/cash-register.orm-entity';
import { CashRegisterMapper } from '../mappers/cash-register.mapper';

@Injectable()
export class CashRegisterRepository implements ICashRegisterRepository {
  constructor(
    @InjectRepository(CashRegisterOrmEntity)
    private readonly repository: Repository<CashRegisterOrmEntity>,
  ) {}

  async findById(id: string): Promise<CashRegister | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? CashRegisterMapper.toDomain(orm) : null;
  }

  async findOpenByStaff(staffId: string): Promise<CashRegister | null> {
    const orm = await this.repository.findOne({
      where: { staffId, status: CashRegisterStatus.OPEN },
    });
    return orm ? CashRegisterMapper.toDomain(orm) : null;
  }

  async findAll(params: {
    page: number;
    limit: number;
    staffId?: string;
    status?: CashRegisterStatus;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ items: CashRegister[]; total: number }> {
    const qb = this.repository.createQueryBuilder('cr');

    if (params.staffId) {
      qb.andWhere('cr.staff_id = :staffId', { staffId: params.staffId });
    }
    if (params.status) {
      qb.andWhere('cr.status = :status', { status: params.status });
    }
    if (params.dateFrom) {
      // Inclusive lower bound at start-of-day in server local TZ.
      qb.andWhere('cr.opened_at >= :dateFrom', {
        dateFrom: new Date(`${params.dateFrom}T00:00:00`),
      });
    }
    if (params.dateTo) {
      // Inclusive upper bound at end-of-day.
      qb.andWhere('cr.opened_at <= :dateTo', {
        dateTo: new Date(`${params.dateTo}T23:59:59.999`),
      });
    }

    qb.orderBy('cr.opened_at', 'DESC');
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [orms, total] = await qb.getManyAndCount();
    return {
      items: orms.map((orm) => CashRegisterMapper.toDomain(orm)),
      total,
    };
  }

  async save(entity: CashRegister): Promise<CashRegister> {
    const orm = CashRegisterMapper.toOrm(entity);
    const saved = await this.repository.save(orm);
    return CashRegisterMapper.toDomain(saved);
  }
}
