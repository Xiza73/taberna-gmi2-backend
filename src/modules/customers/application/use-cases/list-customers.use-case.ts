import { Inject, Injectable } from '@nestjs/common';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto.js';

import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../domain/interfaces/customer-repository.interface.js';
import { type CustomerQueryDto } from '../dtos/customer-query.dto.js';
import { CustomerResponseDto } from '../dtos/customer-response.dto.js';

@Injectable()
export class ListCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(
    query: CustomerQueryDto,
  ): Promise<PaginatedResponseDto<CustomerResponseDto>> {
    const { items, total } = await this.customerRepository.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
      isActive: query.isActive,
    });

    return new PaginatedResponseDto(
      items.map((customer) => new CustomerResponseDto(customer)),
      total,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }
}
