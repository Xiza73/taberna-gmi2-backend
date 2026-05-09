import { BaseEntity } from '@shared/domain/entities/base.entity';
import { DomainException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { CashMovementType } from '../enums/cash-movement-type.enum';

export class CashMovement extends BaseEntity {
  private _cashRegisterId: string;
  private _staffId: string;
  private _type: CashMovementType;
  private _amount: number;
  private _reason: string;

  private constructor(
    id: string,
    cashRegisterId: string,
    staffId: string,
    type: CashMovementType,
    amount: number,
    reason: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._cashRegisterId = cashRegisterId;
    this._staffId = staffId;
    this._type = type;
    this._amount = amount;
    this._reason = reason;
  }

  static create(props: {
    cashRegisterId: string;
    staffId: string;
    type: CashMovementType;
    amount: number;
    reason: string;
  }): CashMovement {
    if (!Number.isInteger(props.amount) || props.amount <= 0) {
      throw new DomainException(ErrorMessages.POS_CASH_MOVEMENT_INVALID_AMOUNT);
    }
    if (!props.reason || props.reason.trim().length === 0) {
      throw new DomainException(ErrorMessages.POS_CASH_MOVEMENT_INVALID_REASON);
    }
    const now = new Date();
    return new CashMovement(
      undefined!,
      props.cashRegisterId,
      props.staffId,
      props.type,
      props.amount,
      props.reason,
      now,
      now,
    );
  }

  static reconstitute(props: {
    id: string;
    cashRegisterId: string;
    staffId: string;
    type: CashMovementType;
    amount: number;
    reason: string;
    createdAt: Date;
    updatedAt: Date;
  }): CashMovement {
    return new CashMovement(
      props.id,
      props.cashRegisterId,
      props.staffId,
      props.type,
      props.amount,
      props.reason,
      props.createdAt,
      props.updatedAt,
    );
  }

  get cashRegisterId(): string {
    return this._cashRegisterId;
  }
  get staffId(): string {
    return this._staffId;
  }
  get type(): CashMovementType {
    return this._type;
  }
  get amount(): number {
    return this._amount;
  }
  get reason(): string {
    return this._reason;
  }
}
