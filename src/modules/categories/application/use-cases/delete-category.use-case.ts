import { Inject, Injectable } from '@nestjs/common';

import {
  DomainException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../domain/interfaces/category-repository.interface.js';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new DomainNotFoundException(ErrorMessages.CATEGORY_NOT_FOUND);
    }

    const hasProducts = await this.categoryRepository.hasProducts(id);
    if (hasProducts) {
      throw new DomainException(ErrorMessages.CATEGORY_HAS_PRODUCTS);
    }

    const hasSubcategories = await this.categoryRepository.hasSubcategories(id);
    if (hasSubcategories) {
      throw new DomainException(ErrorMessages.CATEGORY_HAS_SUBCATEGORIES);
    }

    await this.categoryRepository.delete(id);
  }
}
