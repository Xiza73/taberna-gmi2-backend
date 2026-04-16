import { Inject, Injectable } from '@nestjs/common';

import { ADDRESS_REPOSITORY, type IAddressRepository } from '../../domain/interfaces/address-repository.interface.js';
import { AddressResponseDto } from '../dtos/address-response.dto.js';

@Injectable()
export class ListAddressesUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY) private readonly addressRepository: IAddressRepository,
  ) {}

  async execute(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.addressRepository.findAllByUserId(userId);
    return addresses.map((a) => new AddressResponseDto(a));
  }
}
