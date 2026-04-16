import {
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { Roles } from '@shared/presentation/decorators/roles.decorator.js';

import { AdminListPendingReviewsUseCase } from '../application/use-cases/admin-list-pending-reviews.use-case.js';
import { ApproveReviewUseCase } from '../application/use-cases/approve-review.use-case.js';
import { DeleteReviewUseCase } from '../application/use-cases/delete-review.use-case.js';

@Controller('admin/reviews')
@Roles('admin')
export class AdminReviewsController {
  constructor(
    private readonly adminListPendingReviewsUseCase: AdminListPendingReviewsUseCase,
    private readonly approveReviewUseCase: ApproveReviewUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
  ) {}

  @Get()
  async listPending(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.adminListPendingReviewsUseCase.execute(
      page,
      limit,
    );
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
