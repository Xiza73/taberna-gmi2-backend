import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartModule } from '@modules/cart/cart.module.js';
import { AddressesModule } from '@modules/addresses/addresses.module.js';
import { ProductsModule } from '@modules/products/products.module.js';
import { CustomersModule } from '@modules/customers/customers.module.js';
import { CouponsModule } from '@modules/coupons/coupons.module.js';
import { PaymentsModule } from '@modules/payments/payments.module.js';

import { OrderOrmEntity } from './infrastructure/orm-entities/order.orm-entity.js';
import { OrderItemOrmEntity } from './infrastructure/orm-entities/order-item.orm-entity.js';
import { OrderEventOrmEntity } from './infrastructure/orm-entities/order-event.orm-entity.js';
import { OrderRepository } from './infrastructure/repositories/order.repository.js';
import { OrderNumberGenerator } from './infrastructure/services/order-number-generator.js';
import { OrderExpirationCron } from './infrastructure/cron/order-expiration.cron.js';
import { ORDER_REPOSITORY } from './domain/interfaces/order-repository.interface.js';
import { ORDER_NUMBER_GENERATOR } from './domain/interfaces/order-number-generator.interface.js';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case.js';
import { ListMyOrdersUseCase } from './application/use-cases/list-my-orders.use-case.js';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case.js';
import { CancelOrderUseCase } from './application/use-cases/cancel-order.use-case.js';
import { RetryPaymentUseCase } from './application/use-cases/retry-payment.use-case.js';
import { ProcessPaymentNotificationUseCase } from './application/use-cases/process-payment-notification.use-case.js';
import { VerifyPaymentUseCase } from './application/use-cases/verify-payment.use-case.js';
import { ExpireUnpaidOrdersUseCase } from './application/use-cases/expire-unpaid-orders.use-case.js';
import { AdminListOrdersUseCase } from './application/use-cases/admin-list-orders.use-case.js';
import { AdminGetOrderUseCase } from './application/use-cases/admin-get-order.use-case.js';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case.js';
import { UpdateOrderNotesUseCase } from './application/use-cases/update-order-notes.use-case.js';
import { OrdersController } from './presentation/orders.controller.js';
import { AdminOrdersController } from './presentation/admin-orders.controller.js';
import { WebhooksController } from './presentation/webhooks.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderOrmEntity,
      OrderItemOrmEntity,
      OrderEventOrmEntity,
    ]),
    CartModule,
    AddressesModule,
    ProductsModule,
    CustomersModule,
    CouponsModule,
    PaymentsModule,
  ],
  controllers: [OrdersController, AdminOrdersController, WebhooksController],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: OrderRepository },
    { provide: ORDER_NUMBER_GENERATOR, useClass: OrderNumberGenerator },
    CreateOrderUseCase,
    ListMyOrdersUseCase,
    GetOrderUseCase,
    CancelOrderUseCase,
    RetryPaymentUseCase,
    ProcessPaymentNotificationUseCase,
    VerifyPaymentUseCase,
    ExpireUnpaidOrdersUseCase,
    AdminListOrdersUseCase,
    AdminGetOrderUseCase,
    UpdateOrderStatusUseCase,
    UpdateOrderNotesUseCase,
    OrderExpirationCron,
  ],
  exports: [ORDER_REPOSITORY],
})
export class OrdersModule {}
