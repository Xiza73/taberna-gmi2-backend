import { Module } from '@nestjs/common';

import { OrdersModule } from '@modules/orders/orders.module';
import { ProductsModule } from '@modules/products/products.module';
import { AddressesModule } from '@modules/addresses/addresses.module';
import { CouponsModule } from '@modules/coupons/coupons.module';

import { CreatePosOrderUseCase } from './application/use-cases/create-pos-order.use-case';
import { ListPosOrdersUseCase } from './application/use-cases/list-pos-orders.use-case';
import { GetPosOrderUseCase } from './application/use-cases/get-pos-order.use-case';
import { CancelPosOrderUseCase } from './application/use-cases/cancel-pos-order.use-case';
import { RefundPosOrderUseCase } from './application/use-cases/refund-pos-order.use-case';
import { GetDailyPosReportUseCase } from './application/use-cases/get-daily-pos-report.use-case';
import { GetPaymentMethodReportUseCase } from './application/use-cases/get-payment-method-report.use-case';
import { GetStaffSalesReportUseCase } from './application/use-cases/get-staff-sales-report.use-case';
import { AdminPosOrdersController } from './presentation/admin-pos-orders.controller';
import { AdminPosReportsController } from './presentation/admin-pos-reports.controller';

/**
 * POS module — Orchestration variant (sin domain/infrastructure propios).
 * Reutiliza Order/OrderItem/OrderEvent del módulo orders. Importa repos
 * via tokens exportados por cada módulo dependiente.
 *
 * No exporta nada — sus use cases son consumidos solo por su propio
 * controller.
 */
@Module({
  imports: [OrdersModule, ProductsModule, AddressesModule, CouponsModule],
  controllers: [AdminPosOrdersController, AdminPosReportsController],
  providers: [
    CreatePosOrderUseCase,
    ListPosOrdersUseCase,
    GetPosOrderUseCase,
    CancelPosOrderUseCase,
    RefundPosOrderUseCase,
    GetDailyPosReportUseCase,
    GetPaymentMethodReportUseCase,
    GetStaffSalesReportUseCase,
  ],
})
export class PosModule {}
