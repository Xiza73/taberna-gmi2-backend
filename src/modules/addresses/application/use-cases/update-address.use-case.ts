import { Inject, Injectable } from '@nestjs/common';

import {
  DomainForbiddenException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import {
  ADDRESS_REPOSITORY,
  type IAddressRepository,
} from '../../domain/interfaces/address-repository.interface';
import { type UpdateAddressDto } from '../dtos/update-address.dto';
import { AddressResponseDto } from '../dtos/address-response.dto';

@Injectable()
export class UpdateAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
  ) {}

  async execute(
    userId: string,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    const address = await this.addressRepository.findById(id);
    if (!address) {
      throw new DomainNotFoundException(ErrorMessages.ADDRESS_NOT_FOUND);
    }

    if (address.userId !== userId) {
      throw new DomainForbiddenException(ErrorMessages.ADDRESS_NOT_OWNED);
    }

    address.update(dto);
    const saved = await this.addressRepository.save(address);
    return new AddressResponseDto(saved);
  }
}
