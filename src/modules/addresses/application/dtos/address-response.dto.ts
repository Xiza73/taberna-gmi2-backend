import { type Address } from '../../domain/entities/address.entity.js';

export class AddressResponseDto {
  id: string;
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
  createdAt: string;

  constructor(address: Address) {
    this.id = address.id;
    this.label = address.label;
    this.recipientName = address.recipientName;
    this.phone = address.phone;
    this.street = address.street;
    this.district = address.district;
    this.city = address.city;
    this.department = address.department;
    this.zipCode = address.zipCode;
    this.reference = address.reference;
    this.isDefault = address.isDefault;
    this.createdAt = address.createdAt.toISOString();
  }
}
