import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BannerOrmEntity } from './infrastructure/orm-entities/banner.orm-entity';
import { BannerRepository } from './infrastructure/repositories/banner.repository';
import { BANNER_REPOSITORY } from './domain/interfaces/banner-repository.interface';
import { ListActiveBannersUseCase } from './application/use-cases/list-active-banners.use-case';
import { AdminListBannersUseCase } from './application/use-cases/admin-list-banners.use-case';
import { AdminGetBannerUseCase } from './application/use-cases/admin-get-banner.use-case';
import { CreateBannerUseCase } from './application/use-cases/create-banner.use-case';
import { UpdateBannerUseCase } from './application/use-cases/update-banner.use-case';
import { DeleteBannerUseCase } from './application/use-cases/delete-banner.use-case';
import { BannersController } from './presentation/banners.controller';
import { AdminBannersController } from './presentation/admin-banners.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BannerOrmEntity])],
  controllers: [BannersController, AdminBannersController],
  providers: [
    { provide: BANNER_REPOSITORY, useClass: BannerRepository },
    ListActiveBannersUseCase,
    AdminListBannersUseCase,
    AdminGetBannerUseCase,
    CreateBannerUseCase,
    UpdateBannerUseCase,
    DeleteBannerUseCase,
  ],
  exports: [BANNER_REPOSITORY],
})
export class BannersModule {}
