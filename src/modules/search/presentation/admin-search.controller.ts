import { Controller, Post } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { Roles } from '@shared/presentation/decorators/roles.decorator.js';

import { ReindexProductsUseCase } from '../application/use-cases/reindex-products.use-case.js';

@Controller('admin/search')
@Roles('admin')
export class AdminSearchController {
  constructor(
    private readonly reindexProductsUseCase: ReindexProductsUseCase,
  ) {}

  @Post('reindex')
  async reindex() {
    const result = await this.reindexProductsUseCase.execute();
    return BaseResponse.ok(result);
  }
}
