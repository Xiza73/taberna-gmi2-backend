import { BaseEntity } from '@shared/domain/entities/base.entity.js';

export class Address extends BaseEntity {
  private _userId: string;
  private _label: string;
  private _recipientName: string;
  private _phone: string;
  private _street: string;
  private _district: string;
  private _city: string;
  private _department: string;
  private _zipCode: string | null;
  private _reference: string | null;
  private _isDefault: boolean;

  private constructor(
    id: string,
    userId: string,
    label: string,
    recipientName: string,
    phone: string,
    street: string,
    district: string,
    city: string,
    department: string,
    zipCode: string | null,
    reference: string | null,
    isDefault: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._userId = userId;
    this._label = label;
    this._recipientName = recipientName;
    this._phone = phone;
    this._street = street;
    this._district = district;
    this._city = city;
    this._department = department;
    this._zipCode = zipCode;
    this._reference = reference;
    this._isDefault = isDefault;
  }

  static create(props: {
    userId: string;
    label: string;
    recipientName: string;
    phone: string;
    street: string;
    district: string;
    city: string;
    department: string;
    zipCode?: string | null;
    reference?: string | null;
  }): Address {
    return new Address(
      undefined!,
      props.userId,
      props.label,
      props.recipientName,
      props.phone,
      props.street,
      props.district,
      props.city,
      props.department,
      props.zipCode ?? null,
      props.reference ?? null,
      false,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    label: string;
    recipientName: string;
    phone: string;
    street: string;
    district: string;
    city: string;
    department: string;
    zipCode: string | null;
    reference: string | null;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Address {
    return new Address(
      props.id,
      props.userId,
      props.label,
      props.recipientName,
      props.phone,
      props.street,
      props.district,
      props.city,
      props.department,
      props.zipCode,
      props.reference,
      props.isDefault,
      props.createdAt,
      props.updatedAt,
    );
  }

  get userId(): string { return this._userId; }
  get label(): string { return this._label; }
  get recipientName(): string { return this._recipientName; }
  get phone(): string { return this._phone; }
  get street(): string { return this._street; }
  get district(): string { return this._district; }
  get city(): string { return this._city; }
  get department(): string { return this._department; }
  get zipCode(): string | null { return this._zipCode; }
  get reference(): string | null { return this._reference; }
  get isDefault(): boolean { return this._isDefault; }

  update(props: {
    label?: string;
    recipientName?: string;
    phone?: string;
    street?: string;
    district?: string;
    city?: string;
    department?: string;
    zipCode?: string | null;
    reference?: string | null;
  }): void {
    if (props.label !== undefined) this._label = props.label;
    if (props.recipientName !== undefined) this._recipientName = props.recipientName;
    if (props.phone !== undefined) this._phone = props.phone;
    if (props.street !== undefined) this._street = props.street;
    if (props.district !== undefined) this._district = props.district;
    if (props.city !== undefined) this._city = props.city;
    if (props.department !== undefined) this._department = props.department;
    if (props.zipCode !== undefined) this._zipCode = props.zipCode;
    if (props.reference !== undefined) this._reference = props.reference;
    this.markUpdated();
  }
}
