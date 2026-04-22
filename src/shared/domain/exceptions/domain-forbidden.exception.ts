import { DomainException } from './domain.exception';

export class DomainForbiddenException extends DomainException {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'DomainForbiddenException';
  }
}
