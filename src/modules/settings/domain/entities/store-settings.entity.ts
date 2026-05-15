import { BaseEntity } from '@shared/domain/entities/base.entity';
import { DomainException } from '@shared/domain/exceptions/index';

export const STORE_SETTINGS_SINGLETON_ID =
  '00000000-0000-0000-0000-000000000001';

export class StoreSettings extends BaseEntity {
  private _storeName: string;
  private _legalName: string | null;
  private _address: string | null;
  private _district: string | null;
  private _city: string | null;
  private _phone: string | null;
  private _email: string | null;
  private _ruc: string | null;
  private _currency: string;
  private _igvPercentage: number;
  private _logoUrl: string | null;
  private _faviconUrl: string | null;

  private constructor(
    id: string,
    storeName: string,
    legalName: string | null,
    address: string | null,
    district: string | null,
    city: string | null,
    phone: string | null,
    email: string | null,
    ruc: string | null,
    currency: string,
    igvPercentage: number,
    logoUrl: string | null,
    faviconUrl: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._storeName = storeName;
    this._legalName = legalName;
    this._address = address;
    this._district = district;
    this._city = city;
    this._phone = phone;
    this._email = email;
    this._ruc = ruc;
    this._currency = currency;
    this._igvPercentage = igvPercentage;
    this._logoUrl = logoUrl;
    this._faviconUrl = faviconUrl;
  }

  static createDefault(): StoreSettings {
    return new StoreSettings(
      STORE_SETTINGS_SINGLETON_ID,
      'Mi Tienda',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      'PEN',
      18,
      null,
      null,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    storeName: string;
    legalName: string | null;
    address: string | null;
    district: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
    ruc: string | null;
    currency: string;
    igvPercentage: number;
    logoUrl: string | null;
    faviconUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): StoreSettings {
    return new StoreSettings(
      props.id,
      props.storeName,
      props.legalName,
      props.address,
      props.district,
      props.city,
      props.phone,
      props.email,
      props.ruc,
      props.currency,
      props.igvPercentage,
      props.logoUrl,
      props.faviconUrl,
      props.createdAt,
      props.updatedAt,
    );
  }

  get storeName(): string {
    return this._storeName;
  }
  get legalName(): string | null {
    return this._legalName;
  }
  get address(): string | null {
    return this._address;
  }
  get district(): string | null {
    return this._district;
  }
  get city(): string | null {
    return this._city;
  }
  get phone(): string | null {
    return this._phone;
  }
  get email(): string | null {
    return this._email;
  }
  get ruc(): string | null {
    return this._ruc;
  }
  get currency(): string {
    return this._currency;
  }
  get igvPercentage(): number {
    return this._igvPercentage;
  }
  get logoUrl(): string | null {
    return this._logoUrl;
  }
  get faviconUrl(): string | null {
    return this._faviconUrl;
  }

  update(props: {
    storeName?: string;
    legalName?: string | null;
    address?: string | null;
    district?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    ruc?: string | null;
    currency?: string;
    igvPercentage?: number;
    logoUrl?: string | null;
    faviconUrl?: string | null;
  }): void {
    if (props.storeName !== undefined) {
      if (!props.storeName.trim()) {
        throw new DomainException('storeName must not be empty');
      }
      this._storeName = props.storeName;
    }
    if (props.legalName !== undefined) this._legalName = props.legalName;
    if (props.address !== undefined) this._address = props.address;
    if (props.district !== undefined) this._district = props.district;
    if (props.city !== undefined) this._city = props.city;
    if (props.phone !== undefined) this._phone = props.phone;
    if (props.email !== undefined) this._email = props.email;
    if (props.ruc !== undefined) {
      if (props.ruc !== null && !/^\d{11}$/.test(props.ruc)) {
        throw new DomainException('ruc must be exactly 11 digits');
      }
      this._ruc = props.ruc;
    }
    if (props.currency !== undefined) this._currency = props.currency;
    if (props.igvPercentage !== undefined) {
      if (props.igvPercentage < 0 || props.igvPercentage > 100) {
        throw new DomainException('igvPercentage must be between 0 and 100');
      }
      this._igvPercentage = props.igvPercentage;
    }
    if (props.logoUrl !== undefined) this._logoUrl = props.logoUrl;
    if (props.faviconUrl !== undefined) this._faviconUrl = props.faviconUrl;
    this.markUpdated();
  }
}
