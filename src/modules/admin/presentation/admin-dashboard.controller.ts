import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { Roles } from '@shared/presentation/decorators/roles.decorator.js';

import { GetDashboardUseCase } from '../application/use-cases/get-dashboard.use-case.js';
import { GetSalesReportUseCase } from '../application/use-cases/get-sales-report.use-case.js';
import { GetTopProductsUseCase } from '../application/use-cases/get-top-products.use-case.js';
import { SalesReportQueryDto } from '../application/dtos/sales-report-query.dto.js';

@Controller('admin/dashboard')
@Roles('admin')
export class AdminDashboardController {
  constructor(
    private readonly getDashboardUseCase: GetDashboardUseCase,
    private readonly getSalesReportUseCase: GetSalesReportUseCase,
    private readonly getTopProductsUseCase: GetTopProductsUseCase,
  ) {}

  @Get()
  async getDashboard() {
    const result = await this.getDashboardUseCase.execute();
    return BaseResponse.ok(result);
  }

  @Get('sales')
  async getSalesReport(@Query() dto: SalesReportQueryDto) {
    const result = await this.getSalesReportUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @Get('top-products')
  async getTopProducts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const result = await this.getTopProductsUseCase.execute(safeLimit);
    return BaseResponse.ok(result);
  }
}
