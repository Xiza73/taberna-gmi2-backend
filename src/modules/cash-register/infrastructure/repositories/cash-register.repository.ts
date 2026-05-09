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

  async save(entity: CashRegister): Promise<CashRegister> {
    const orm = CashRegisterMapper.toOrm(entity);
    const saved = await this.repository.save(orm);
    return CashRegisterMapper.toDomain(saved);
  }
}
