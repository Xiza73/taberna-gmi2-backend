import { Module } from '@nestjs/common';

import { GetDashboardUseCase } from './application/use-cases/get-dashboard.use-case.js';
import { GetSalesReportUseCase } from './application/use-cases/get-sales-report.use-case.js';
import { GetTopProductsUseCase } from './application/use-cases/get-top-products.use-case.js';
import { AdminDashboardController } from './presentation/admin-dashboard.controller.js';

@Module({
  controllers: [AdminDashboardController],
  providers: [
    GetDashboardUseCase,
    GetSalesReportUseCase,
    GetTopProductsUseCase,
  ],
})
export class AdminModule {}
