import { DomainException } from '../exceptions';

export class Money {
  private readonly _amount: number;
  private readonly _currency: string;

  private constructor(amount: number, currency: string) {
    this._amount = amount;
    this._currency = currency;
  }

  static create(amount: number, currency = 'PEN'): Money {
    if (!Number.isInteger(amount)) {
      throw new DomainException('Money amount must be an integer (cents)');
    }
    if (amount < 0) {
      throw new DomainException('Money amount cannot be negative');
    }
    return new Money(amount, currency);
  }

  static fromExisting(amount: number, currency = 'PEN'): Money {
    return new Money(amount, currency);
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  add(other: Money): Money {
    return new Money(this._amount + other._amount, this._currency);
  }

  subtract(other: Money): Money {
    return new Money(this._amount - other._amount, this._currency);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this._amount * factor), this._currency);
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }
}
