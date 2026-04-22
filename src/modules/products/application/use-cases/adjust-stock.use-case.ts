import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../domain/interfaces/product-repository.interface';
import { type AdjustStockDto } from '../dtos/adjust-stock.dto';
import { ProductResponseDto } from '../dtos/product-response.dto';

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
