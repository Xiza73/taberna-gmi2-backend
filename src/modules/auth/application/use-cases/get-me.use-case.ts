import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';

import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../../customers/domain/interfaces/customer-repository.interface';
import { CustomerResponseDto } from '../../../customers/application/dtos/customer-response.dto';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(userId: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findById(userId);
    if (!customer) throw new DomainNotFoundException('Customer', userId);
    return new CustomerResponseDto(customer);
  }
}
