import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto.js';
import { PaginationDto } from '@shared/application/dtos/pagination.dto.js';
import { Roles } from '@shared/presentation/decorators/roles.decorator.js';

import { AdminListBannersUseCase } from '../application/use-cases/admin-list-banners.use-case.js';
import { AdminGetBannerUseCase } from '../application/use-cases/admin-get-banner.use-case.js';
import { CreateBannerUseCase } from '../application/use-cases/create-banner.use-case.js';
import { UpdateBannerUseCase } from '../application/use-cases/update-banner.use-case.js';
import { DeleteBannerUseCase } from '../application/use-cases/delete-banner.use-case.js';
import { CreateBannerDto } from '../application/dtos/create-banner.dto.js';
import { UpdateBannerDto } from '../application/dtos/update-banner.dto.js';

@Controller('admin/banners')
@Roles('admin')
export class AdminBannersController {
  constructor(
    private readonly adminListBannersUseCase: AdminListBannersUseCase,
    private readonly adminGetBannerUseCase: AdminGetBannerUseCase,
    private readonly createBannerUseCase: CreateBannerUseCase,
    private readonly updateBannerUseCase: UpdateBannerUseCase,
    private readonly deleteBannerUseCase: DeleteBannerUseCase,
  ) {}

  @Get()
  async list(@Query() query: PaginationDto) {
    const result = await this.adminListBannersUseCase.execute(query);
    return BaseResponse.ok(result);
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.adminGetBannerUseCase.execute(id);
    return BaseResponse.ok(result);
  }

  @Post()
  async create(@Body() dto: CreateBannerDto) {
    const result = await this.createBannerUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBannerDto,
  ) {
    const result = await this.updateBannerUseCase.execute(id, dto);
    return BaseResponse.ok(result);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteBannerUseCase.execute(id);
    return BaseResponse.ok(null, 'Banner deleted successfully');
  }
}
