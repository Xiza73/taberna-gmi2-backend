import { Inject, Injectable } from '@nestjs/common';

import {
  PRODUCT_SEARCH,
  type IProductSearchService,
} from '../../domain/interfaces/product-search.interface';
import { type SearchSuggestQueryDto } from '../dtos/search-suggest-query.dto';

@Injectable()
export class SuggestProductsUseCase {
  constructor(
    @Inject(PRODUCT_SEARCH)
    private readonly searchService: IProductSearchService,
  ) {}

  async execute(dto: SearchSuggestQueryDto): Promise<string[]> {
    return this.searchService.suggest(dto.q, dto.limit ?? 5);
  }
}
