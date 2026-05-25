import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { BaseResponse } from '@shared/application/dtos/base-response.dto';
import { Public } from '@shared/presentation/decorators/public.decorator';

import { RegisterStaffUseCase } from '../application/use-cases/register-staff.use-case';
import { RegisterStaffDto } from '../application/dtos/register-staff.dto';

/**
 * Registro público de staff. Endpoint único que cubre dos flujos:
 *
 * 1. **Primer usuario del sistema** (tabla `staff_members` vacía):
 *    el solicitante se promueve a SUPER_ADMIN sin necesidad de
 *    `invitationToken`. Bootstrap inicial — pensado para que el
 *    deploy inicial no requiera SQL manual ni un seed.
 *
 * 2. **Resto de los usuarios**: `invitationToken` es obligatorio y
 *    debe corresponder a una invitación válida; el rol viene de la
 *    invitación y el email debe coincidir con el invitado.
 */
@Controller('staff')
export class StaffRegisterController {
  constructor(private readonly registerStaffUseCase: RegisterStaffUseCase) {}

  @Post('register')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async register(@Body() dto: RegisterStaffDto) {
    const result = await this.registerStaffUseCase.execute(dto);
    return BaseResponse.ok(result);
  }
}
