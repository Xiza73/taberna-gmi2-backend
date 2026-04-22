import { Inject, Injectable, Optional } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../../domain/interfaces/product-repository.interface';
import {
  PRODUCT_SEARCH_SYNC,
  type IProductSearchSync,
} from '../../domain/interfaces/product-search-sync.interface';

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Optional()
    @Inject(PRODUCT_SEARCH_SYNC)
    private readonly searchSync?: IProductSearchSync,
  ) {}

  async execute(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new DomainNotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);
    }

    product.deactivate();
    await this.productRepository.save(product);
    await this.searchSync?.removeProduct(id);
  }
}
