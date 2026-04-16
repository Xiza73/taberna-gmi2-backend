import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../domain/interfaces/product-repository.interface.js';
import { type AdjustStockDto } from '../dtos/adjust-stock.dto.js';
import { ProductResponseDto } from '../dtos/product-response.dto.js';

@Injectable()
export class AdjustStockUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string, dto: AdjustStockDto): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new DomainNotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);
    }

    product.adjustStock(dto.quantity);
    const saved = await this.productRepository.save(product);
    return new ProductResponseDto(saved);
  }
}
