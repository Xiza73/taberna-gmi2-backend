import { Body, Controller, Get, Patch } from '@nestjs/common';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { CurrentUser } from '@shared/presentation/decorators/current-user.decorator';

import { GetCustomerProfileUseCase } from '../application/use-cases/get-customer-profile.use-case';
import { UpdateCustomerProfileUseCase } from '../application/use-cases/update-customer-profile.use-case';
import { ChangeCustomerPasswordUseCase } from '../application/use-cases/change-customer-password.use-case';
import { UpdateCustomerProfileDto } from '../application/dtos/update-customer-profile.dto';
import { ChangePasswordDto } from '../application/dtos/change-password.dto';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly getCustomerProfileUseCase: GetCustomerProfileUseCase,
    private readonly updateCustomerProfileUseCase: UpdateCustomerProfileUseCase,
    private readonly changeCustomerPasswordUseCase: ChangeCustomerPasswordUseCase,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') customerId: string) {
    const result = await this.getCustomerProfileUseCase.execute(customerId);
    return BaseResponse.ok(result);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser('id') customerId: string,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    const result = await this.updateCustomerProfileUseCase.execute(
      customerId,
      dto,
    );
    return BaseResponse.ok(result);
  }

  @Patch('change-password')
  async changePassword(
    @CurrentUser('id') customerId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.changeCustomerPasswordUseCase.execute(customerId, dto);
    return BaseResponse.ok(null, 'Password changed successfully');
  }
}
