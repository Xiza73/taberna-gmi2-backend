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

@Injectable()
export class DeleteAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    const address = await this.addressRepository.findById(id);
    if (!address) {
      throw new DomainNotFoundException(ErrorMessages.ADDRESS_NOT_FOUND);
    }

    if (address.userId !== userId) {
      throw new DomainForbiddenException(ErrorMessages.ADDRESS_NOT_OWNED);
    }

    await this.addressRepository.delete(id);
  }
}
