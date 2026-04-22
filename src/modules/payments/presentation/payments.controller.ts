import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';

import { GetPaymentDetailsUseCase } from '../application/use-cases/get-payment-details.use-case';

@Controller('admin/orders')
@RequireSubjectType(SubjectType.STAFF)
export class PaymentsController {
  constructor(
    private readonly getPaymentDetailsUseCase: GetPaymentDetailsUseCase,
  ) {}

  @Get(':id/payment')
  async getPaymentDetails(@Param('id', ParseUUIDPipe) orderId: string) {
    const result = await this.getPaymentDetailsUseCase.execute(orderId);
    return BaseResponse.ok(result);
  }
}
