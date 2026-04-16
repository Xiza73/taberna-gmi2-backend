import { DomainException } from './domain.exception.js';

export class DomainConflictException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'DomainConflictException';
  }
}
