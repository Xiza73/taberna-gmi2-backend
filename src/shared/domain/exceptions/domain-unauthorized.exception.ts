import { DomainException } from './domain.exception';

export class DomainUnauthorizedException extends DomainException {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'DomainUnauthorizedException';
  }
}
