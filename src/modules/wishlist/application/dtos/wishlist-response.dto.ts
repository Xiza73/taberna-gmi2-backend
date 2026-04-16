export class WishlistItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  price: number;
  addedAt: string;

  constructor(props: {
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    productImage: string | null;
    price: number;
    addedAt: Date;
  }) {
    this.id = props.id;
    this.productId = props.productId;
    this.productName = props.productName;
    this.productSlug = props.productSlug;
    this.productImage = props.productImage;
    this.price = props.price;
    this.addedAt = props.addedAt.toISOString();
  }
}
