import { Inject, Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

import { ErrorMessages } from '@shared/domain/constants/error-messages';
import { DomainException } from '@shared/domain/exceptions/index';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../../staff/domain/interfaces/staff-member-repository.interface';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../domain/interfaces/refresh-token-repository.interface';
import { type ResetPasswordDto } from '../dtos/reset-password.dto';

@Injectable()
export class StaffResetPasswordUseCase {
  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    const [staffId, rawToken] = dto.token.split('.');
    if (!staffId || !rawToken) {
      throw new DomainException(ErrorMessages.INVALID_RESET_TOKEN);
    }

    const staff = await this.staffRepository.findById(staffId);
    if (!staff || !staff.resetPasswordToken || !staff.resetPasswordExpires) {
      throw new DomainException(ErrorMessages.INVALID_RESET_TOKEN);
    }

    if (staff.resetPasswordExpires < new Date()) {
      throw new DomainException(ErrorMessages.INVALID_RESET_TOKEN);
    }

    const valid = await compare(rawToken, staff.resetPasswordToken);
    if (!valid) {
      throw new DomainException(ErrorMessages.INVALID_RESET_TOKEN);
    }

    const hashedPassword = await hash(dto.newPassword, 12);
    staff.changePassword(hashedPassword);
    staff.clearResetPasswordToken();
    await this.staffRepository.save(staff);

    await this.refreshTokenRepository.revokeAllByUser(staff.id);
  }
}
