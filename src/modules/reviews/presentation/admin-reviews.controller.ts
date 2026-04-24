import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';

import { AdminListReviewsUseCase } from '../application/use-cases/admin-list-reviews.use-case';
import { ApproveReviewUseCase } from '../application/use-cases/approve-review.use-case';
import { DeleteReviewUseCase } from '../application/use-cases/delete-review.use-case';
import { AdminReviewQueryDto } from '../application/dtos/admin-review-query.dto';

@Controller('admin/reviews')
@RequireSubjectType(SubjectType.STAFF)
export class AdminReviewsController {
  constructor(
    private readonly adminListReviewsUseCase: AdminListReviewsUseCase,
    private readonly approveReviewUseCase: ApproveReviewUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
  ) {}

  @Get()
  async list(@Query() query: AdminReviewQueryDto) {
    const result = await this.adminListReviewsUseCase.execute(query);
    return BaseResponse.ok(result);
  }

  @Post(':id/approve')
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.approveReviewUseCase.execute(id);
    return BaseResponse.ok(result);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteReviewUseCase.execute(id);
    return BaseResponse.ok(null);
  }
}
