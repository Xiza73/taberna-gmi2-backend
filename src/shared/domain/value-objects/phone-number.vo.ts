import { DomainException } from '../exceptions';

export class PhoneNumber {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): PhoneNumber {
    if (!value || !PhoneNumber.isValid(value)) {
      throw new DomainException('Invalid phone number format');
    }
    return new PhoneNumber(value.replace(/\s+/g, ''));
  }

  static fromExisting(value: string): PhoneNumber {
    return new PhoneNumber(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }

  private static isValid(phone: string): boolean {
    return /^\+?[0-9\s\-()]{7,20}$/.test(phone);
  }
}
