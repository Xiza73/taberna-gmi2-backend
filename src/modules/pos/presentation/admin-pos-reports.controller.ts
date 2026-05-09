import { Controller, Get, Query } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { RequireStaffRole } from '@shared/presentation/decorators/staff-role.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';
import { StaffRole } from '@shared/domain/enums/staff-role.enum';

import { GetDailyPosReportUseCase } from '../application/use-cases/get-daily-pos-report.use-case';
import { GetPaymentMethodReportUseCase } from '../application/use-cases/get-payment-method-report.use-case';
import { GetStaffSalesReportUseCase } from '../application/use-cases/get-staff-sales-report.use-case';
import { DailyReportQueryDto } from '../application/dtos/daily-report-query.dto';
import { PaymentMethodReportQueryDto } from '../application/dtos/payment-method-report-query.dto';
import { StaffSalesReportQueryDto } from '../application/dtos/staff-sales-report-query.dto';

@Controller('admin/pos/reports')
@RequireSubjectType(SubjectType.STAFF)
@RequireStaffRole(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)
export class AdminPosReportsController {
  constructor(
    private readonly getDailyPosReportUseCase: GetDailyPosReportUseCase,
    private readonly getPaymentMethodReportUseCase: GetPaymentMethodReportUseCase,
    private readonly getStaffSalesReportUseCase: GetStaffSalesReportUseCase,
  ) {}

  @Get('daily')
  async daily(@Query() dto: DailyReportQueryDto) {
    const result = await this.getDailyPosReportUseCase.execute(dto.date);
    return BaseResponse.ok(result);
  }

  @Get('by-payment-method')
  async byPaymentMethod(@Query() dto: PaymentMethodReportQueryDto) {
    const result = await this.getPaymentMethodReportUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @Get('by-staff')
  @RequireStaffRole(StaffRole.SUPER_ADMIN)
  async byStaff(@Query() dto: StaffSalesReportQueryDto) {
    const result = await this.getStaffSalesReportUseCase.execute(dto);
    return BaseResponse.ok(result);
  }
}
