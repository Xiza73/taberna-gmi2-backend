import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartModule } from '@modules/cart/cart.module';
import { AddressesModule } from '@modules/addresses/addresses.module';
import { ProductsModule } from '@modules/products/products.module';
import { CustomersModule } from '@modules/customers/customers.module';
import { CouponsModule } from '@modules/coupons/coupons.module';
import { PaymentsModule } from '@modules/payments/payments.module';

import { OrderOrmEntity } from './infrastructure/orm-entities/order.orm-entity';
import { OrderItemOrmEntity } from './infrastructure/orm-entities/order-item.orm-entity';
import { OrderEventOrmEntity } from './infrastructure/orm-entities/order-event.orm-entity';
import { OrderRepository } from './infrastructure/repositories/order.repository';
import { OrderNumberGenerator } from './infrastructure/services/order-number-generator';
import { OrderExpirationCron } from './infrastructure/cron/order-expiration.cron';
import { ORDER_REPOSITORY } from './domain/interfaces/order-repository.interface';
import { ORDER_NUMBER_GENERATOR } from './domain/interfaces/order-number-generator.interface';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { ListMyOrdersUseCase } from './application/use-cases/list-my-orders.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { CancelOrderUseCase } from './application/use-cases/cancel-order.use-case';
import { RetryPaymentUseCase } from './application/use-cases/retry-payment.use-case';
import { ProcessPaymentNotificationUseCase } from './application/use-cases/process-payment-notification.use-case';
import { VerifyPaymentUseCase } from './application/use-cases/verify-payment.use-case';
import { ExpireUnpaidOrdersUseCase } from './application/use-cases/expire-unpaid-orders.use-case';
import { AdminListOrdersUseCase } from './application/use-cases/admin-list-orders.use-case';
import { AdminGetOrderUseCase } from './application/use-cases/admin-get-order.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { UpdateOrderNotesUseCase } from './application/use-cases/update-order-notes.use-case';
import { OrdersController } from './presentation/orders.controller';
import { AdminOrdersController } from './presentation/admin-orders.controller';
import { WebhooksController } from './presentation/webhooks.controller';

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
