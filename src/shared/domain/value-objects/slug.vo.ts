import { DomainException } from '../exceptions';

export class Slug {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Slug {
    if (!value || !value.trim()) {
      throw new DomainException('Slug cannot be empty');
    }
    const slugified = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slugified) {
      throw new DomainException('Slug cannot be empty after sanitization');
    }
    return new Slug(slugified);
  }

  static fromExisting(value: string): Slug {
    return new Slug(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Slug): boolean {
    return this._value === other._value;
  }
}
