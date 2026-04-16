import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BannerOrmEntity } from './infrastructure/orm-entities/banner.orm-entity.js';
import { BannerRepository } from './infrastructure/repositories/banner.repository.js';
import { BANNER_REPOSITORY } from './domain/interfaces/banner-repository.interface.js';
import { ListActiveBannersUseCase } from './application/use-cases/list-active-banners.use-case.js';
import { AdminListBannersUseCase } from './application/use-cases/admin-list-banners.use-case.js';
import { AdminGetBannerUseCase } from './application/use-cases/admin-get-banner.use-case.js';
import { CreateBannerUseCase } from './application/use-cases/create-banner.use-case.js';
import { UpdateBannerUseCase } from './application/use-cases/update-banner.use-case.js';
import { DeleteBannerUseCase } from './application/use-cases/delete-banner.use-case.js';
import { BannersController } from './presentation/banners.controller.js';
import { AdminBannersController } from './presentation/admin-banners.controller.js';

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
