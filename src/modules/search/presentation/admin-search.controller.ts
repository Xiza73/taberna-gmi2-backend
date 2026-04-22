import { Controller, Post } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';

import { ReindexProductsUseCase } from '../application/use-cases/reindex-products.use-case';

@Controller('admin/search')
@RequireSubjectType(SubjectType.STAFF)
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
