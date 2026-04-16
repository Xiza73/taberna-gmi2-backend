import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import { PRODUCT_REPOSITORY, type IProductRepository } from '../../domain/interfaces/product-repository.interface.js';
import { ProductResponseDto } from '../dtos/product-response.dto.js';

@Injectable()
export class AdminGetProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new DomainNotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);
    }
    return new ProductResponseDto(product);
  }
}
