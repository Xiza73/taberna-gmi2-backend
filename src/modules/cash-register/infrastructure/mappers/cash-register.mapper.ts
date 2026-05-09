import { CashRegister } from '../../domain/entities/cash-register.entity';
import { CashRegisterOrmEntity } from '../orm-entities/cash-register.orm-entity';

export class CashRegisterMapper {
  static toDomain(orm: CashRegisterOrmEntity): CashRegister {
    return CashRegister.reconstitute({
      id: orm.id,
      staffId: orm.staffId,
      openedAt: orm.openedAt,
      closedAt: orm.closedAt,
      initialAmount: orm.initialAmount,
      closingAmount: orm.closingAmount,
      expectedAmount: orm.expectedAmount,
      difference: orm.difference,
      status: orm.status,
      notes: orm.notes,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: CashRegister): CashRegisterOrmEntity {
    const orm = new CashRegisterOrmEntity();
    orm.id = domain.id;
    orm.staffId = domain.staffId;
    orm.openedAt = domain.openedAt;
    orm.closedAt = domain.closedAt;
    orm.initialAmount = domain.initialAmount;
    orm.closingAmount = domain.closingAmount;
    orm.expectedAmount = domain.expectedAmount;
    orm.difference = domain.difference;
    orm.status = domain.status;
    orm.notes = domain.notes;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
