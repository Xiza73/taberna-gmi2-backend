import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryOrmEntity } from './infrastructure/orm-entities/category.orm-entity.js';
import { CategoryRepository } from './infrastructure/repositories/category.repository.js';
import { CATEGORY_REPOSITORY } from './domain/interfaces/category-repository.interface.js';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case.js';
import { GetCategoryBySlugUseCase } from './application/use-cases/get-category-by-slug.use-case.js';
import { AdminListCategoriesUseCase } from './application/use-cases/admin-list-categories.use-case.js';
import { AdminGetCategoryUseCase } from './application/use-cases/admin-get-category.use-case.js';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case.js';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case.js';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case.js';
import { CategoriesController } from './presentation/categories.controller.js';
import { AdminCategoriesController } from './presentation/admin-categories.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryOrmEntity])],
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [
    { provide: CATEGORY_REPOSITORY, useClass: CategoryRepository },
    ListCategoriesUseCase,
    GetCategoryBySlugUseCase,
    AdminListCategoriesUseCase,
    AdminGetCategoryUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
  ],
  exports: [CATEGORY_REPOSITORY],
})
export class CategoriesModule {}
