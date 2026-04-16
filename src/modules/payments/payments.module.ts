import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentOrmEntity } from './infrastructure/orm-entities/payment.orm-entity.js';
import { PaymentRepository } from './infrastructure/repositories/payment.repository.js';
import { MercadoPagoPaymentService } from './infrastructure/services/mercado-pago-payment.service.js';
import { PAYMENT_REPOSITORY } from './domain/interfaces/payment-repository.interface.js';
import { PAYMENT_PROVIDER } from './domain/interfaces/payment-provider.interface.js';
import { CreatePaymentPreferenceUseCase } from './application/use-cases/create-payment-preference.use-case.js';
import { GetPaymentDetailsUseCase } from './application/use-cases/get-payment-details.use-case.js';
import { PaymentsController } from './presentation/payments.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentOrmEntity])],
  controllers: [PaymentsController],
  providers: [
    { provide: PAYMENT_REPOSITORY, useClass: PaymentRepository },
    { provide: PAYMENT_PROVIDER, useClass: MercadoPagoPaymentService },
    CreatePaymentPreferenceUseCase,
    GetPaymentDetailsUseCase,
  ],
  exports: [PAYMENT_PROVIDER, PAYMENT_REPOSITORY],
})
export class PaymentsModule {}
