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

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { RequireSubjectType } from '@shared/presentation/decorators/subject-type.decorator';
import { SubjectType } from '@shared/domain/enums/subject-type.enum';

import { AdminListProductsUseCase } from '../application/use-cases/admin-list-products.use-case';
import { AdminGetProductUseCase } from '../application/use-cases/admin-get-product.use-case';
import { CreateProductUseCase } from '../application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from '../application/use-cases/delete-product.use-case';
import { AdjustStockUseCase } from '../application/use-cases/adjust-stock.use-case';
import { ProductQueryDto } from '../application/dtos/product-query.dto';
import { CreateProductDto } from '../application/dtos/create-product.dto';
import { UpdateProductDto } from '../application/dtos/update-product.dto';
import { AdjustStockDto } from '../application/dtos/adjust-stock.dto';

@Controller('admin/products')
@RequireSubjectType(SubjectType.STAFF)
export class AdminProductsController {
  constructor(
    private readonly adminListProductsUseCase: AdminListProductsUseCase,
    private readonly adminGetProductUseCase: AdminGetProductUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly adjustStockUseCase: AdjustStockUseCase,
  ) {}

  @Get()
  async list(@Query() query: ProductQueryDto) {
    const result = await this.adminListProductsUseCase.execute(query);
    return BaseResponse.ok(result);
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.adminGetProductUseCase.execute(id);
    return BaseResponse.ok(result);
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const result = await this.createProductUseCase.execute(dto);
    return BaseResponse.ok(result);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const result = await this.updateProductUseCase.execute(id, dto);
    return BaseResponse.ok(result);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteProductUseCase.execute(id);
    return BaseResponse.ok(null, 'Product deleted successfully');
  }

  @Patch(':id/stock')
  async adjustStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustStockDto,
  ) {
    const result = await this.adjustStockUseCase.execute(id, dto);
    return BaseResponse.ok(result);
  }
}
