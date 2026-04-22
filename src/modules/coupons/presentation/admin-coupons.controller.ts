import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { PaginationDto } from '@shared/application/dtos/pagination.dto';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';

import { AdminListCouponsUseCase } from '../application/use-cases/admin-list-coupons.use-case';
import { AdminGetCouponUseCase } from '../application/use-cases/admin-get-coupon.use-case';
import { CreateCouponUseCase } from '../application/use-cases/create-coupon.use-case';
import { UpdateCouponUseCase } from '../application/use-cases/update-coupon.use-case';
import { DeleteCouponUseCase } from '../application/use-cases/delete-coupon.use-case';
import { CreateCouponDto } from '../application/dtos/create-coupon.dto';
import { UpdateCouponDto } from '../application/dtos/update-coupon.dto';

@Controller('admin/coupons')
@RequireSubjectType(SubjectType.STAFF)
export class AdminCouponsController {
  constructor(
    private readonly adminListCouponsUseCase: AdminListCouponsUseCase,
    private readonly adminGetCouponUseCase: AdminGetCouponUseCase,
    private readonly createCouponUseCase: CreateCouponUseCase,
    private readonly updateCouponUseCase: UpdateCouponUseCase,
    private readonly deleteCouponUseCase: DeleteCouponUseCase,
  ) {}

  @Get()
  async list(@Query() query: PaginationDto) {
    const result = await this.adminListCouponsUseCase.execute(query);
    return BaseResponse.ok(result);
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.adminGetCouponUseCase.execute(id);
    return BaseResponse.ok(result);
  }

  @Post()
  async create(@Body() dto: CreateCouponDto) {
    const result = await this.createCouponUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    const result = await this.updateCouponUseCase.execute(id, dto);
    return BaseResponse.ok(result);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteCouponUseCase.execute(id);
    return BaseResponse.ok(null, 'Coupon deleted successfully');
  }
}
