import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';

import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../domain/interfaces/customer-repository.interface.js';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../../auth/domain/interfaces/refresh-token-repository.interface.js';
import { CustomerResponseDto } from '../dtos/customer-response.dto.js';

@Injectable()
export class SuspendCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(customerId: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) throw new DomainNotFoundException('Customer', customerId);

    customer.suspend();
    const saved = await this.customerRepository.save(customer);

    await this.refreshTokenRepository.revokeAllByUser(customerId);

    return new CustomerResponseDto(saved);
  }
}
