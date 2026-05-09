import { BaseEntity } from '@shared/domain/entities/base.entity';
import {
  DomainConflictException,
  DomainException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { CashRegisterStatus } from '../enums/cash-register-status.enum';

export class CashRegister extends BaseEntity {
  private _staffId: string;
  private _openedAt: Date;
  private _closedAt: Date | null;
  private _initialAmount: number;
  private _closingAmount: number | null;
  private _expectedAmount: number | null;
  private _difference: number | null;
  private _status: CashRegisterStatus;
  private _notes: string | null;

  private constructor(
    id: string,
    staffId: string,
    openedAt: Date,
    closedAt: Date | null,
    initialAmount: number,
    closingAmount: number | null,
    expectedAmount: number | null,
    difference: number | null,
    status: CashRegisterStatus,
    notes: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._staffId = staffId;
    this._openedAt = openedAt;
    this._closedAt = closedAt;
    this._initialAmount = initialAmount;
    this._closingAmount = closingAmount;
    this._expectedAmount = expectedAmount;
    this._difference = difference;
    this._status = status;
    this._notes = notes;
  }

  static create(props: { staffId: string; initialAmount: number }): CashRegister {
    if (!Number.isInteger(props.initialAmount) || props.initialAmount < 0) {
      throw new DomainException(ErrorMessages.POS_CASH_REGISTER_INVALID_AMOUNT);
    }
    const now = new Date();
    return new CashRegister(
      undefined!,
      props.staffId,
      now,
      null,
      props.initialAmount,
      null,
      null,
      null,
      CashRegisterStatus.OPEN,
      null,
      now,
      now,
    );
  }

  static reconstitute(props: {
    id: string;
    staffId: string;
    openedAt: Date;
    closedAt: Date | null;
    initialAmount: number;
    closingAmount: number | null;
    expectedAmount: number | null;
    difference: number | null;
    status: CashRegisterStatus;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): CashRegister {
    return new CashRegister(
      props.id,
      props.staffId,
      props.openedAt,
      props.closedAt,
      props.initialAmount,
      props.closingAmount,
      props.expectedAmount,
      props.difference,
      props.status,
      props.notes,
      props.createdAt,
      props.updatedAt,
    );
  }

  get staffId(): string {
    return this._staffId;
  }
  get openedAt(): Date {
    return this._openedAt;
  }
  get closedAt(): Date | null {
    return this._closedAt;
  }
  get initialAmount(): number {
    return this._initialAmount;
  }
  get closingAmount(): number | null {
    return this._closingAmount;
  }
  get expectedAmount(): number | null {
    return this._expectedAmount;
  }
  get difference(): number | null {
    return this._difference;
  }
  get status(): CashRegisterStatus {
    return this._status;
  }
  get notes(): string | null {
    return this._notes;
  }

  close(props: {
    closingAmount: number;
    expectedAmount: number;
    difference: number;
    notes?: string | null;
  }): void {
    if (this._status !== CashRegisterStatus.OPEN) {
      throw new DomainConflictException(
        ErrorMessages.POS_CASH_REGISTER_ALREADY_CLOSED,
      );
    }
    this._closingAmount = props.closingAmount;
    this._expectedAmount = props.expectedAmount;
    this._difference = props.difference;
    this._notes = props.notes ?? null;
    this._closedAt = new Date();
    this._status = CashRegisterStatus.CLOSED;
    this.markUpdated();
  }
}
