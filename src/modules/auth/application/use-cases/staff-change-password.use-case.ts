import { Inject, Injectable } from '@nestjs/common';
import { hash, compare } from 'bcryptjs';

import { ErrorMessages } from '@shared/domain/constants/error-messages';
import {
  DomainException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../../staff/domain/interfaces/staff-member-repository.interface';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../domain/interfaces/refresh-token-repository.interface';
import { type ChangePasswordDto } from '../../../customers/application/dtos/change-password.dto';

@Injectable()
export class StaffChangePasswordUseCase {
  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffRepository: IStaffMemberRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(staffId: string, dto: ChangePasswordDto): Promise<void> {
    const staff = await this.staffRepository.findById(staffId);
    if (!staff)
      throw new DomainNotFoundException(ErrorMessages.STAFF_NOT_FOUND);

    const valid = await compare(dto.currentPassword, staff.password);
    if (!valid) throw new DomainException(ErrorMessages.WRONG_PASSWORD);

    const hashedPassword = await hash(dto.newPassword, 12);
    staff.changePassword(hashedPassword);
    await this.staffRepository.save(staff);

    await this.refreshTokenRepository.revokeAllByUser(staffId);
  }
}
