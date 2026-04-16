import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { Public } from '@shared/presentation/decorators/public.decorator.js';

import { ValidateCouponUseCase } from '../application/use-cases/validate-coupon.use-case.js';
import { ListAvailableCouponsUseCase } from '../application/use-cases/list-available-coupons.use-case.js';
import { ValidateCouponDto } from '../application/dtos/validate-coupon.dto.js';

@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly validateCouponUseCase: ValidateCouponUseCase,
    private readonly listAvailableCouponsUseCase: ListAvailableCouponsUseCase,
  ) {}

  @Public()
  @Get()
  async list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.listAvailableCouponsUseCase.execute(page, limit);
    return BaseResponse.ok(result);
  }

  @Post('validate')
  async validate(@Body() dto: ValidateCouponDto) {
    const result = await this.validateCouponUseCase.execute(dto);
    return BaseResponse.ok(result);
  }
}
