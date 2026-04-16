import { Controller, Get } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { Public } from '@shared/presentation/decorators/public.decorator.js';

import { ListActiveBannersUseCase } from '../application/use-cases/list-active-banners.use-case.js';

@Controller('banners')
@Public()
export class BannersController {
  constructor(
    private readonly listActiveBannersUseCase: ListActiveBannersUseCase,
  ) {}

  @Get()
  async list() {
    const result = await this.listActiveBannersUseCase.execute();
    return BaseResponse.ok(result);
  }
}
