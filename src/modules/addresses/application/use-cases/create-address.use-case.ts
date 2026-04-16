import { Inject, Injectable } from '@nestjs/common';

import { DomainException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';

import { Address } from '../../domain/entities/address.entity.js';
import { ADDRESS_REPOSITORY, type IAddressRepository } from '../../domain/interfaces/address-repository.interface.js';
import { type CreateAddressDto } from '../dtos/create-address.dto.js';
import { AddressResponseDto } from '../dtos/address-response.dto.js';

@Injectable()
export class CreateAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY) private readonly addressRepository: IAddressRepository,
  ) {}

  async execute(userId: string, dto: CreateAddressDto): Promise<AddressResponseDto> {
    const count = await this.addressRepository.countByUserId(userId);
    if (count >= 10) {
      throw new DomainException(ErrorMessages.ADDRESS_LIMIT_REACHED);
    }

    const address = Address.create({
      userId,
      label: dto.label,
      recipientName: dto.recipientName,
      phone: dto.phone,
      street: dto.street,
      district: dto.district,
      city: dto.city,
      department: dto.department,
      zipCode: dto.zipCode,
      reference: dto.reference,
    });

    const saved = await this.addressRepository.save(address);
    return new AddressResponseDto(saved);
  }
}
