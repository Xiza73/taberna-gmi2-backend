import { type Customer } from '../../domain/entities/customer.entity';

export class CustomerResponseDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;

  constructor(customer: Customer) {
    this.id = customer.id;
    this.name = customer.name;
    this.email = customer.email;
    this.phone = customer.phone;
    this.isActive = customer.isActive;
    this.createdAt = customer.createdAt.toISOString();
  }
}
