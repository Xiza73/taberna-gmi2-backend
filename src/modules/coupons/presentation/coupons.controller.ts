import { Body, Controller, Post } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';

import { ValidateCouponUseCase } from '../application/use-cases/validate-coupon.use-case.js';
import { ValidateCouponDto } from '../application/dtos/validate-coupon.dto.js';

@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly validateCouponUseCase: ValidateCouponUseCase,
  ) {}

  @Post('validate')
  async validate(@Body() dto: ValidateCouponDto) {
    const result = await this.validateCouponUseCase.execute(dto);
    return BaseResponse.ok(result);
  }
}
