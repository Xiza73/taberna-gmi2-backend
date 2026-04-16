import { Inject, Injectable } from '@nestjs/common';

import { DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../domain/interfaces/category-repository.interface.js';
import { CategoryResponseDto } from '../dtos/category-response.dto.js';

@Injectable()
export class AdminGetCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new DomainNotFoundException(ErrorMessages.CATEGORY_NOT_FOUND);
    }
    return new CategoryResponseDto(category);
  }
}
