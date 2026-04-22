import { Inject, Injectable, Optional } from '@nestjs/common';

import {
  DomainConflictException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '@modules/categories/domain/interfaces/category-repository.interface';

import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../domain/interfaces/product-repository.interface';
import {
  PRODUCT_SEARCH_SYNC,
  type IProductSearchSync,
} from '../../domain/interfaces/product-search-sync.interface';
import { type UpdateProductDto } from '../dtos/update-product.dto';
import { ProductResponseDto } from '../dtos/product-response.dto';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    @Optional()
    @Inject(PRODUCT_SEARCH_SYNC)
    private readonly searchSync?: IProductSearchSync,
  ) {}

  async execute(
    id: string,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new DomainNotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);
    }

    if (dto.slug !== undefined) {
      const slugExists = await this.productRepository.slugExists(dto.slug, id);
      if (slugExists) {
        throw new DomainConflictException(ErrorMessages.SLUG_ALREADY_EXISTS);
      }
    }

    if (dto.sku !== undefined && dto.sku !== null) {
      const skuExists = await this.productRepository.skuExists(dto.sku, id);
      if (skuExists) {
        throw new DomainConflictException(ErrorMessages.SKU_ALREADY_EXISTS);
      }
    }

    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepository.findById(dto.categoryId);
      if (!category) {
        throw new DomainNotFoundException(ErrorMessages.CATEGORY_NOT_FOUND);
      }
    }

    product.update(dto);
    const saved = await this.productRepository.save(product);
    await this.searchSync?.indexProduct(saved);
    return new ProductResponseDto(saved);
  }
}
