import { type Product } from '../entities/product.entity';

export const PRODUCT_SEARCH_SYNC = Symbol('PRODUCT_SEARCH_SYNC');

export interface IProductSearchSync {
  indexProduct(product: Product): Promise<void>;
  removeProduct(productId: string): Promise<void>;
}
