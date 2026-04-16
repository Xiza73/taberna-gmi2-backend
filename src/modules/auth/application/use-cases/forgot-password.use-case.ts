import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import {
  EMAIL_SENDER,
  type IEmailSender,
} from '@modules/notifications/domain/interfaces/email-sender.interface.js';

import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../../customers/domain/interfaces/customer-repository.interface.js';
import { type ForgotPasswordDto } from '../dtos/forgot-password.dto.js';

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    const customer = await this.customerRepository.findByEmail(dto.email);

    // Always return success to prevent email enumeration
    if (!customer) return;

    const rawToken = randomUUID();
    const tokenHash = await hash(rawToken, 12);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    customer.setResetPasswordToken(tokenHash, expires);
    await this.customerRepository.save(customer);

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${customer.id}.${rawToken}`;
    this.emailSender
      .sendPasswordReset({
        name: customer.name,
        email: customer.email,
        resetUrl,
      })
      .catch(() => {});
  }
}
