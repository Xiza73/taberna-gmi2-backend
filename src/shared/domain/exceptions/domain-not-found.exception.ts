import { DomainException } from './domain.exception';

export class DomainNotFoundException extends DomainException {
  constructor(entity: string, id?: string) {
    super(id ? `${entity} with id ${id} not found` : `${entity} not found`);
    this.name = 'DomainNotFoundException';
  }
}
