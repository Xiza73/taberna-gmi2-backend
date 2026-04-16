import { type TransactionContext } from './unit-of-work.interface.js';

export interface IBaseRepository<T> {
  save(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  delete(id: string): Promise<void>;
  withTransaction(ctx: TransactionContext): this;
}
