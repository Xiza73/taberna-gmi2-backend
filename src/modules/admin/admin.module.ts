import { Module } from '@nestjs/common';

import { GetDashboardUseCase } from './application/use-cases/get-dashboard.use-case';
import { GetSalesReportUseCase } from './application/use-cases/get-sales-report.use-case';
import { GetTopProductsUseCase } from './application/use-cases/get-top-products.use-case';
import { AdminDashboardController } from './presentation/admin-dashboard.controller';

@Module({
  controllers: [AdminDashboardController],
  providers: [
    GetDashboardUseCase,
    GetSalesReportUseCase,
    GetTopProductsUseCase,
  ],
})
export class AdminModule {}
