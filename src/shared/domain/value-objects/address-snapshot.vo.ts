import { DomainException } from '../exceptions';

export class AddressSnapshot {
  private readonly _recipientName: string;
  private readonly _phone: string;
  private readonly _street: string;
  private readonly _reference: string | null;
  private readonly _district: string;
  private readonly _city: string;
  private readonly _department: string;

  private constructor(
    recipientName: string,
    phone: string,
    street: string,
    reference: string | null,
    district: string,
    city: string,
    department: string,
  ) {
    this._recipientName = recipientName;
    this._phone = phone;
    this._street = street;
    this._reference = reference;
    this._district = district;
    this._city = city;
    this._department = department;
  }

  static create(props: {
    recipientName: string;
    phone: string;
    street: string;
    reference?: string | null;
    district: string;
    city: string;
    department: string;
  }): AddressSnapshot {
    if (
      !props.recipientName ||
      !props.street ||
      !props.city ||
      !props.department
    ) {
      throw new DomainException(
        'Address snapshot requires recipientName, street, city, and department',
      );
    }
    return new AddressSnapshot(
      props.recipientName,
      props.phone,
      props.street,
      props.reference ?? null,
      props.district,
      props.city,
      props.department,
    );
  }

  static fromExisting(props: {
    recipientName: string;
    phone: string;
    street: string;
    reference: string | null;
    district: string;
    city: string;
    department: string;
  }): AddressSnapshot {
    return new AddressSnapshot(
      props.recipientName,
      props.phone,
      props.street,
      props.reference,
      props.district,
      props.city,
      props.department,
    );
  }

  get recipientName(): string {
    return this._recipientName;
  }

  get phone(): string {
    return this._phone;
  }

  get street(): string {
    return this._street;
  }

  get reference(): string | null {
    return this._reference;
  }

  get district(): string {
    return this._district;
  }

  get city(): string {
    return this._city;
  }

  get department(): string {
    return this._department;
  }

  toJSON(): Record<string, string | null> {
    return {
      recipientName: this._recipientName,
      phone: this._phone,
      street: this._street,
      reference: this._reference,
      district: this._district,
      city: this._city,
      department: this._department,
    };
  }
}
