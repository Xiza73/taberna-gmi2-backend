import { type StoreSettings } from '../../domain/entities/store-settings.entity';

export class StoreSettingsResponseDto {
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
  createdAt: string;
  updatedAt: string;

  constructor(settings: StoreSettings) {
    this.id = settings.id;
    this.storeName = settings.storeName;
    this.legalName = settings.legalName;
    this.address = settings.address;
    this.district = settings.district;
    this.city = settings.city;
    this.phone = settings.phone;
    this.email = settings.email;
    this.ruc = settings.ruc;
    this.currency = settings.currency;
    this.igvPercentage = settings.igvPercentage;
    this.logoUrl = settings.logoUrl;
    this.faviconUrl = settings.faviconUrl;
    this.createdAt = settings.createdAt.toISOString();
    this.updatedAt = settings.updatedAt.toISOString();
  }
}
