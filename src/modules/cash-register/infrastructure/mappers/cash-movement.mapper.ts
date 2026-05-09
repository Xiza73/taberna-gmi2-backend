import { CashMovement } from '../../domain/entities/cash-movement.entity';
import { CashMovementOrmEntity } from '../orm-entities/cash-movement.orm-entity';

export class CashMovementMapper {
  static toDomain(orm: CashMovementOrmEntity): CashMovement {
    return CashMovement.reconstitute({
      id: orm.id,
      cashRegisterId: orm.cashRegisterId,
      staffId: orm.staffId,
      type: orm.type,
      amount: orm.amount,
      reason: orm.reason,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: CashMovement): CashMovementOrmEntity {
    const orm = new CashMovementOrmEntity();
    orm.id = domain.id;
    orm.cashRegisterId = domain.cashRegisterId;
    orm.staffId = domain.staffId;
    orm.type = domain.type;
    orm.amount = domain.amount;
    orm.reason = domain.reason;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
