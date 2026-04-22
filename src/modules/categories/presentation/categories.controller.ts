import { Controller, Get, Param } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { Public } from '@shared/presentation/decorators/public.decorator';

import { ListCategoriesUseCase } from '../application/use-cases/list-categories.use-case';
import { GetCategoryBySlugUseCase } from '../application/use-cases/get-category-by-slug.use-case';

@Controller('categories')
@Public()
export class CategoriesController {
  constructor(
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly getCategoryBySlugUseCase: GetCategoryBySlugUseCase,
  ) {}

  @Get()
  async list() {
    const result = await this.listCategoriesUseCase.execute();
    return BaseResponse.ok(result);
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const result = await this.getCategoryBySlugUseCase.execute(slug);
    return BaseResponse.ok(result);
  }
}
