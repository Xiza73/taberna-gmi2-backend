import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryOrmEntity } from './infrastructure/orm-entities/category.orm-entity';
import { CategoryRepository } from './infrastructure/repositories/category.repository';
import { CATEGORY_REPOSITORY } from './domain/interfaces/category-repository.interface';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { GetCategoryBySlugUseCase } from './application/use-cases/get-category-by-slug.use-case';
import { AdminListCategoriesUseCase } from './application/use-cases/admin-list-categories.use-case';
import { AdminGetCategoryUseCase } from './application/use-cases/admin-get-category.use-case';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';
import { CategoriesController } from './presentation/categories.controller';
import { AdminCategoriesController } from './presentation/admin-categories.controller';

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
