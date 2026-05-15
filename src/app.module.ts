import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { BannersModule } from './modules/banners/banners.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { CartModule } from './modules/cart/cart.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PosModule } from './modules/pos/pos.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AdminModule } from './modules/admin/admin.module';
import { StaffModule } from './modules/staff/staff.module';
import { SearchModule } from './modules/search/search.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HealthModule } from './health/health.module';
import { GlobalExceptionFilter } from './shared/presentation/filters/global-exception.filter';
import { JwtAuthGuard } from './shared/presentation/guards/jwt-auth.guard';
import { SubjectTypeGuard } from './shared/presentation/guards/subject-type.guard';
import { StaffRoleGuard } from './shared/presentation/guards/staff-role.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 1500 }]),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        database: config.get<string>('DB_NAME', 'ecommerce_gmi2'),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        extra: { max: 20, connectionTimeoutMillis: 5000 },
      }),
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: Number(config.get('JWT_EXPIRATION', 300)) },
      }),
      global: true,
    }),
    SharedModule,
    AuthModule,
    CustomersModule,
    CategoriesModule,
    ProductsModule,
    BannersModule,
    UploadsModule,
    CartModule,
    AddressesModule,
    WishlistModule,
    CouponsModule,
    PaymentsModule,
    OrdersModule,
    PosModule,
    CashRegisterModule,
    ShippingModule,
    NotificationsModule,
    ReviewsModule,
    AdminModule,
    StaffModule,
    SearchModule,
    SettingsModule,
    HealthModule,
  ],
  providers: [
    // Global Exception Filter (via DI)
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    // Guard chain: Throttle → Auth → SubjectType → StaffRole (R21)
    JwtAuthGuard,
    SubjectTypeGuard,
    StaffRoleGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: SubjectTypeGuard },
    { provide: APP_GUARD, useExisting: StaffRoleGuard },
  ],
})
export class AppModule {}
