import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator';

import { ListAddressesUseCase } from '../application/use-cases/list-addresses.use-case';
import { CreateAddressUseCase } from '../application/use-cases/create-address.use-case';
import { UpdateAddressUseCase } from '../application/use-cases/update-address.use-case';
import { DeleteAddressUseCase } from '../application/use-cases/delete-address.use-case';
import { SetDefaultAddressUseCase } from '../application/use-cases/set-default-address.use-case';
import { CreateAddressDto } from '../application/dtos/create-address.dto';
import { UpdateAddressDto } from '../application/dtos/update-address.dto';

@Controller('addresses')
export class AddressesController {
  constructor(
    private readonly listAddressesUseCase: ListAddressesUseCase,
    private readonly createAddressUseCase: CreateAddressUseCase,
    private readonly updateAddressUseCase: UpdateAddressUseCase,
    private readonly deleteAddressUseCase: DeleteAddressUseCase,
    private readonly setDefaultAddressUseCase: SetDefaultAddressUseCase,
  ) {}

  @Get()
  async list(@CurrentUser('id') userId: string) {
    const result = await this.listAddressesUseCase.execute(userId);
    return BaseResponse.ok(result);
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAddressDto,
  ) {
    const result = await this.createAddressUseCase.execute(userId, dto);
    return BaseResponse.ok(result);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const result = await this.updateAddressUseCase.execute(userId, id, dto);
    return BaseResponse.ok(result);
  }

  @Delete(':id')
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.deleteAddressUseCase.execute(userId, id);
    return BaseResponse.ok(null, 'Address deleted successfully');
  }

  @Post(':id/default')
  async setDefault(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.setDefaultAddressUseCase.execute(userId, id);
    return BaseResponse.ok(null, 'Default address updated');
  }
}
