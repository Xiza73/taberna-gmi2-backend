import { Inject, Injectable } from '@nestjs/common';

import { PaginatedResponseDto } from '@shared/application/dtos/pagination.dto';

import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../domain/interfaces/product-repository.interface';
import { type ProductQueryDto } from '../dtos/product-query.dto';
import { ProductResponseDto } from '../dtos/product-response.dto';

@Injectable()
export class AdminListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(
    query: ProductQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.productRepository.findAll({
      page,
      limit,
      categoryId: query.categoryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      search: query.search,
      sortBy: query.sortBy,
      includeInactive: query.includeInactive ?? true,
    });

    return new PaginatedResponseDto(
      items.map((p) => new ProductResponseDto(p)),
      total,
      page,
      limit,
    );
  }
}
