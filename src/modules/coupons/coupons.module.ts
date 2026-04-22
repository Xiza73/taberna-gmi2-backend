import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CouponOrmEntity } from './infrastructure/orm-entities/coupon.orm-entity';
import { CouponRepository } from './infrastructure/repositories/coupon.repository';
import { COUPON_REPOSITORY } from './domain/interfaces/coupon-repository.interface';
import {
  CouponCalculator,
  COUPON_CALCULATOR,
} from './domain/services/coupon-calculator';
import { ValidateCouponUseCase } from './application/use-cases/validate-coupon.use-case';
import { AdminListCouponsUseCase } from './application/use-cases/admin-list-coupons.use-case';
import { AdminGetCouponUseCase } from './application/use-cases/admin-get-coupon.use-case';
import { CreateCouponUseCase } from './application/use-cases/create-coupon.use-case';
import { UpdateCouponUseCase } from './application/use-cases/update-coupon.use-case';
import { DeleteCouponUseCase } from './application/use-cases/delete-coupon.use-case';
import { ListAvailableCouponsUseCase } from './application/use-cases/list-available-coupons.use-case';
import { CouponsController } from './presentation/coupons.controller';
import { AdminCouponsController } from './presentation/admin-coupons.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CouponOrmEntity])],
  controllers: [CouponsController, AdminCouponsController],
  providers: [
    { provide: COUPON_REPOSITORY, useClass: CouponRepository },
    { provide: COUPON_CALCULATOR, useValue: new CouponCalculator() },
    ValidateCouponUseCase,
    ListAvailableCouponsUseCase,
    AdminListCouponsUseCase,
    AdminGetCouponUseCase,
    CreateCouponUseCase,
    UpdateCouponUseCase,
    DeleteCouponUseCase,
  ],
  exports: [COUPON_REPOSITORY, COUPON_CALCULATOR],
})
export class CouponsModule {}
