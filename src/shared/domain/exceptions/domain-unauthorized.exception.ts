import { DomainException } from './domain.exception.js';

export class DomainUnauthorizedException extends DomainException {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'DomainUnauthorizedException';
  }
}
