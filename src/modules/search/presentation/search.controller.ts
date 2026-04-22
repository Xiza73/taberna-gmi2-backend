import { Controller, Get, Query } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { Public } from '@shared/presentation/decorators/public.decorator';

import { SearchProductsUseCase } from '../application/use-cases/search-products.use-case';
import { SuggestProductsUseCase } from '../application/use-cases/suggest-products.use-case';
import { SearchQueryDto } from '../application/dtos/search-query.dto';
import { SearchSuggestQueryDto } from '../application/dtos/search-suggest-query.dto';

@Controller('search')
@Public()
export class SearchController {
  constructor(
    private readonly searchProductsUseCase: SearchProductsUseCase,
    private readonly suggestProductsUseCase: SuggestProductsUseCase,
  ) {}

  @Get()
  async search(@Query() dto: SearchQueryDto) {
    const result = await this.searchProductsUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @Get('suggest')
  async suggest(@Query() dto: SearchSuggestQueryDto) {
    const result = await this.suggestProductsUseCase.execute(dto);
    return BaseResponse.ok(result);
  }
}
