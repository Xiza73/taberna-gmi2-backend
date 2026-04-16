export const PRODUCT_SEARCH = Symbol('PRODUCT_SEARCH');

export interface ProductSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  categoryName: string;
  averageRating: number | null;
  stock: number;
}

export interface IProductSearchService {
  search(params: {
    query: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page: number;
    limit: number;
  }): Promise<{ items: ProductSearchResult[]; total: number }>;

  suggest(query: string, limit: number): Promise<string[]>;
}
