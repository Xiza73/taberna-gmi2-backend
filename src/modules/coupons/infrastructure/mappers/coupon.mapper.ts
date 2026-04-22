import { Coupon } from '../../domain/entities/coupon.entity';
import { CouponOrmEntity } from '../orm-entities/coupon.orm-entity';

export class CouponMapper {
  static toDomain(orm: CouponOrmEntity): Coupon {
    return Coupon.reconstitute({
      id: orm.id,
      code: orm.code,
      type: orm.type,
      value: orm.value,
      minPurchase: orm.minPurchase,
      maxDiscount: orm.maxDiscount,
      maxUses: orm.maxUses,
      maxUsesPerUser: orm.maxUsesPerUser,
      currentUses: orm.currentUses,
      isActive: orm.isActive,
      startDate: orm.startDate,
      endDate: orm.endDate,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Coupon): CouponOrmEntity {
    const orm = new CouponOrmEntity();
    orm.id = domain.id;
    orm.code = domain.code;
    orm.type = domain.type;
    orm.value = domain.value;
    orm.minPurchase = domain.minPurchase;
    orm.maxDiscount = domain.maxDiscount;
    orm.maxUses = domain.maxUses;
    orm.maxUsesPerUser = domain.maxUsesPerUser;
    orm.currentUses = domain.currentUses;
    orm.isActive = domain.isActive;
    orm.startDate = domain.startDate;
    orm.endDate = domain.endDate;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
