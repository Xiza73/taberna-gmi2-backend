import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { Roles } from '@shared/presentation/decorators/roles.decorator.js';

import { AdminListCategoriesUseCase } from '../application/use-cases/admin-list-categories.use-case.js';
import { AdminGetCategoryUseCase } from '../application/use-cases/admin-get-category.use-case.js';
import { CreateCategoryUseCase } from '../application/use-cases/create-category.use-case.js';
import { UpdateCategoryUseCase } from '../application/use-cases/update-category.use-case.js';
import { DeleteCategoryUseCase } from '../application/use-cases/delete-category.use-case.js';
import { CategoryQueryDto } from '../application/dtos/category-query.dto.js';
import { CreateCategoryDto } from '../application/dtos/create-category.dto.js';
import { UpdateCategoryDto } from '../application/dtos/update-category.dto.js';

@Controller('admin/categories')
@Roles('admin')
export class AdminCategoriesController {
  constructor(
    private readonly adminListCategoriesUseCase: AdminListCategoriesUseCase,
    private readonly adminGetCategoryUseCase: AdminGetCategoryUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
  ) {}

  @Get()
  async list(@Query() query: CategoryQueryDto) {
    const result = await this.adminListCategoriesUseCase.execute(query);
    return BaseResponse.ok(result);
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.adminGetCategoryUseCase.execute(id);
    return BaseResponse.ok(result);
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    const result = await this.createCategoryUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    const result = await this.updateCategoryUseCase.execute(id, dto);
    return BaseResponse.ok(result);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteCategoryUseCase.execute(id);
    return BaseResponse.ok(null, 'Category deleted successfully');
  }
}
