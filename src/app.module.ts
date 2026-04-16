import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { SharedModule } from './shared/shared.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { BannersModule } from './modules/banners/banners.module.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { AddressesModule } from './modules/addresses/addresses.module.js';
import { WishlistModule } from './modules/wishlist/wishlist.module.js';
import { CouponsModule } from './modules/coupons/coupons.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { ShippingModule } from './modules/shipping/shipping.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { GlobalExceptionFilter } from './shared/presentation/filters/global-exception.filter.js';
import { JwtAuthGuard } from './shared/presentation/guards/jwt-auth.guard.js';
import { RolesGuard } from './shared/presentation/guards/roles.guard.js';

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
        signOptions: { expiresIn: config.get<number>('JWT_EXPIRATION', 300) },
      }),
      global: true,
    }),
    SharedModule,
    AuthModule,
    UsersModule,
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
    ShippingModule,
    NotificationsModule,
    ReviewsModule,
  ],
  providers: [
    // Global Exception Filter (via DI)
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    // Guard chain: Throttle → Auth → Roles
    JwtAuthGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
