export class CartItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  price: number;
  quantity: number;
  subtotal: number;

  constructor(props: {
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    productImage: string | null;
    price: number;
    quantity: number;
  }) {
    this.id = props.id;
    this.productId = props.productId;
    this.productName = props.productName;
    this.productSlug = props.productSlug;
    this.productImage = props.productImage;
    this.price = props.price;
    this.quantity = props.quantity;
    this.subtotal = props.price * props.quantity;
  }
}

export class CartResponseDto {
  items: CartItemResponseDto[];
  total: number;

  constructor(items: CartItemResponseDto[]) {
    this.items = items;
    this.total = items.reduce((sum, item) => sum + item.subtotal, 0);
  }
}
