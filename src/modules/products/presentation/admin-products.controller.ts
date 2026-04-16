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
import { Roles } from '@shared/presentation/decorators/roles.decorator.js';

import { AdminListProductsUseCase } from '../application/use-cases/admin-list-products.use-case.js';
import { AdminGetProductUseCase } from '../application/use-cases/admin-get-product.use-case.js';
import { CreateProductUseCase } from '../application/use-cases/create-product.use-case.js';
import { UpdateProductUseCase } from '../application/use-cases/update-product.use-case.js';
import { DeleteProductUseCase } from '../application/use-cases/delete-product.use-case.js';
import { AdjustStockUseCase } from '../application/use-cases/adjust-stock.use-case.js';
import { ProductQueryDto } from '../application/dtos/product-query.dto.js';
import { CreateProductDto } from '../application/dtos/create-product.dto.js';
import { UpdateProductDto } from '../application/dtos/update-product.dto.js';
import { AdjustStockDto } from '../application/dtos/adjust-stock.dto.js';

@Controller('admin/products')
@Roles('admin')
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
