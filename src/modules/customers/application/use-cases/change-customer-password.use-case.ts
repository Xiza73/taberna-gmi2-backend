import { Inject, Injectable } from '@nestjs/common';
import { hash, compare } from 'bcryptjs';

import { ErrorMessages } from '@shared/domain/constants/error-messages.js';
import {
  DomainException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index.js';

import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../domain/interfaces/customer-repository.interface.js';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../../auth/domain/interfaces/refresh-token-repository.interface.js';
import { type ChangePasswordDto } from '../dtos/change-password.dto.js';

@Injectable()
export class ChangeCustomerPasswordUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(customerId: string, dto: ChangePasswordDto): Promise<void> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) throw new DomainNotFoundException('Customer', customerId);

    const valid = await compare(dto.currentPassword, customer.password);
    if (!valid) throw new DomainException(ErrorMessages.WRONG_PASSWORD);

    const hashedPassword = await hash(dto.newPassword, 12);
    customer.changePassword(hashedPassword);
    await this.customerRepository.save(customer);

    await this.refreshTokenRepository.revokeAllByUser(customerId);
  }
}
