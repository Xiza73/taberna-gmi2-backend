import { Controller, Get, Param, Query } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { Public } from '@shared/presentation/decorators/public.decorator';

import { ListProductsUseCase } from '../application/use-cases/list-products.use-case';
import { GetProductBySlugUseCase } from '../application/use-cases/get-product-by-slug.use-case';
import { ProductQueryDto } from '../application/dtos/product-query.dto';

@Controller('products')
@Public()
export class ProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductBySlugUseCase: GetProductBySlugUseCase,
  ) {}

  @Get()
  async list(@Query() query: ProductQueryDto) {
    const result = await this.listProductsUseCase.execute(query);
    return BaseResponse.ok(result);
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const result = await this.getProductBySlugUseCase.execute(slug);
    return BaseResponse.ok(result);
  }
}
