import { Inject, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';

import { DomainConflictException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/interfaces/staff-member-repository.interface';
import { StaffMember } from '../../domain/entities/staff-member.entity';
import { type CreateStaffMemberDto } from '../dtos/create-staff-member.dto';
import { StaffMemberResponseDto } from '../dtos/staff-member-response.dto';

@Injectable()
export class CreateStaffMemberUseCase {
  constructor(
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffMemberRepository: IStaffMemberRepository,
  ) {}

  async execute(dto: CreateStaffMemberDto): Promise<StaffMemberResponseDto> {
    const existing = await this.staffMemberRepository.findByEmail(dto.email);
    if (existing) {
      throw new DomainConflictException(ErrorMessages.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await hash(dto.password, 12);

    const staff = StaffMember.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
    });

    const saved = await this.staffMemberRepository.save(staff);
    return new StaffMemberResponseDto(saved);
  }
}
