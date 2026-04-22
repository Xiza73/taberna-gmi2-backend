import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';

import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../domain/interfaces/customer-repository.interface';
import { type UpdateCustomerDto } from '../dtos/update-customer.dto';
import { CustomerResponseDto } from '../dtos/customer-response.dto';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(
    customerId: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) throw new DomainNotFoundException('Customer', customerId);

    customer.updateProfile({ name: dto.name, phone: dto.phone });

    const saved = await this.customerRepository.save(customer);
    return new CustomerResponseDto(saved);
  }
}
