import { Inject, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';

import { DomainConflictException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import {
  STAFF_MEMBER_REPOSITORY,
  type IStaffMemberRepository,
} from '../../domain/interfaces/staff-member-repository.interface.js';
import { StaffMember } from '../../domain/entities/staff-member.entity.js';
import { type CreateStaffMemberDto } from '../dtos/create-staff-member.dto.js';
import { StaffMemberResponseDto } from '../dtos/staff-member-response.dto.js';

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
    });

    const saved = await this.staffMemberRepository.save(staff);
    return new StaffMemberResponseDto(saved);
  }
}
