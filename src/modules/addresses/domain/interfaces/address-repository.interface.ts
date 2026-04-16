import { type IBaseRepository } from '@shared/domain/interfaces/base-repository.interface.js';

import { type Address } from '../entities/address.entity.js';

export const ADDRESS_REPOSITORY = Symbol('ADDRESS_REPOSITORY');

export interface IAddressRepository extends IBaseRepository<Address> {
  findAllByUserId(userId: string): Promise<Address[]>;
  countByUserId(userId: string): Promise<number>;
  setDefault(addressId: string, userId: string): Promise<void>;
}
