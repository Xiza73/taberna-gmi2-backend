import { Inject, Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { DomainException } from '@shared/domain/exceptions/index';

import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../../customers/domain/interfaces/customer-repository.interface';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../domain/interfaces/refresh-token-repository.interface';
import { type ResetPasswordDto } from '../dtos/reset-password.dto';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    // Find user by iterating — in production, add a findByResetToken method
    // For now, the token contains user-identifying info via the reset flow
    const [userId, rawToken] = dto.token.split('.');
    if (!userId || !rawToken) {
      throw new DomainException(ErrorMessages.INVALID_RESET_TOKEN);
    }

    const customer = await this.customerRepository.findById(userId);
    if (
      !customer ||
      !customer.resetPasswordToken ||
      !customer.resetPasswordExpires
    ) {
      throw new DomainException(ErrorMessages.INVALID_RESET_TOKEN);
    }

    if (customer.resetPasswordExpires < new Date()) {
      throw new DomainException(ErrorMessages.INVALID_RESET_TOKEN);
    }

    const valid = await compare(rawToken, customer.resetPasswordToken);
    if (!valid) {
      throw new DomainException(ErrorMessages.INVALID_RESET_TOKEN);
    }

    const hashedPassword = await hash(dto.newPassword, 12);
    customer.changePassword(hashedPassword);
    customer.clearResetPasswordToken();
    await this.customerRepository.save(customer);

    await this.refreshTokenRepository.revokeAllByUser(customer.id);
  }
}
