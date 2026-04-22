import { DomainException } from './domain.exception';

export class DomainConflictException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'DomainConflictException';
  }
}
