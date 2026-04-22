import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface';

import { type Customer } from '../entities/customer.entity';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface ICustomerRepository extends IBaseRepository<Customer> {
  findByEmail(email: string): Promise<Customer | null>;
  findByGoogleId(googleId: string): Promise<Customer | null>;
  findAll(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: Customer[]; total: number }>;
}
