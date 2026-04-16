import { Inject, Injectable, Optional } from '@nestjs/common';

import {
  DomainConflictException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '@modules/categories/domain/interfaces/category-repository.interface.js';

import { Product } from '../../domain/entities/product.entity.js';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../domain/interfaces/product-repository.interface.js';
import {
  PRODUCT_SEARCH_SYNC,
  type IProductSearchSync,
} from '../../domain/interfaces/product-search-sync.interface.js';
import { type CreateProductDto } from '../dtos/create-product.dto.js';
import { ProductResponseDto } from '../dtos/product-response.dto.js';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    @Optional()
    @Inject(PRODUCT_SEARCH_SYNC)
    private readonly searchSync?: IProductSearchSync,
  ) {}

  async execute(dto: CreateProductDto): Promise<ProductResponseDto> {
    const slugExists = await this.productRepository.slugExists(dto.slug);
    if (slugExists) {
      throw new DomainConflictException(ErrorMessages.SLUG_ALREADY_EXISTS);
    }

    if (dto.sku) {
      const skuExists = await this.productRepository.skuExists(dto.sku);
      if (skuExists) {
        throw new DomainConflictException(ErrorMessages.SKU_ALREADY_EXISTS);
      }
    }

    const category = await this.categoryRepository.findById(dto.categoryId);
    if (!category) {
      throw new DomainNotFoundException(ErrorMessages.CATEGORY_NOT_FOUND);
    }

    const product = Product.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      price: dto.price,
      compareAtPrice: dto.compareAtPrice,
      sku: dto.sku,
      stock: dto.stock,
      images: dto.images,
      categoryId: dto.categoryId,
    });

    const saved = await this.productRepository.save(product);
    await this.searchSync?.indexProduct(saved);
    return new ProductResponseDto(saved);
  }
}
