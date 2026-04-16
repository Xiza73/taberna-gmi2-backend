export const ORDER_NUMBER_GENERATOR = Symbol('ORDER_NUMBER_GENERATOR');

export interface IOrderNumberGenerator {
  generate(): Promise<string>;
}
