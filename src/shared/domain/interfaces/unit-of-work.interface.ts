export type TransactionContext = unknown;

export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');

export interface IUnitOfWork {
  execute<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T>;
}
