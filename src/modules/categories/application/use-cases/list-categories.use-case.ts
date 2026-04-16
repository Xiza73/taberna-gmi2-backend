import { Inject, Injectable } from '@nestjs/common';

import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../domain/interfaces/category-repository.interface.js';
import { CategoryResponseDto } from '../dtos/category-response.dto.js';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.findAllActive();
    return categories.map((c) => new CategoryResponseDto(c));
  }
}
