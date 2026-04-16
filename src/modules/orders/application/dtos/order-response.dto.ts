import { type Order } from '../../domain/entities/order.entity.js';
import { type OrderItem } from '../../domain/entities/order-item.entity.js';
import { type OrderEvent } from '../../domain/entities/order-event.entity.js';

export class OrderItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;

  constructor(item: OrderItem) {
    this.id = item.id;
    this.productId = item.productId;
    this.productName = item.productName;
    this.productSlug = item.productSlug;
    this.productImage = item.productImage;
    this.unitPrice = item.unitPrice;
    this.quantity = item.quantity;
    this.subtotal = item.subtotal;
  }
}

export class OrderEventResponseDto {
  id: string;
  status: string;
  description: string;
  performedBy: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;

  constructor(event: OrderEvent) {
    this.id = event.id;
    this.status = event.status;
    this.description = event.description;
    this.performedBy = event.performedBy;
    this.metadata = event.metadata;
    this.createdAt = event.createdAt.toISOString();
  }
}

export class OrderResponseDto {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  couponId: string | null;
  couponCode: string | null;
  couponDiscount: number | null;
  shippingAddressSnapshot: Record<string, unknown>;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItemResponseDto[];
  events?: OrderEventResponseDto[];
  paymentUrl?: string | null;

  constructor(order: Order, extras?: {
    items?: OrderItem[];
    events?: OrderEvent[];
    paymentUrl?: string | null;
  }) {
    this.id = order.id;
    this.orderNumber = order.orderNumber;
    this.userId = order.userId;
    this.status = order.status;
    this.subtotal = order.subtotal;
    this.discount = order.discount;
    this.shippingCost = order.shippingCost;
    this.total = order.total;
    this.couponId = order.couponId;
    this.couponCode = order.couponCode;
    this.couponDiscount = order.couponDiscount;
    this.shippingAddressSnapshot = order.shippingAddressSnapshot;
    this.customerName = order.customerName;
    this.customerEmail = order.customerEmail;
    this.customerPhone = order.customerPhone;
    this.notes = order.notes;
    this.adminNotes = order.adminNotes;
    this.createdAt = order.createdAt.toISOString();
    this.updatedAt = order.updatedAt.toISOString();
    if (extras?.items) {
      this.items = extras.items.map((i) => new OrderItemResponseDto(i));
    }
    if (extras?.events) {
      this.events = extras.events.map((e) => new OrderEventResponseDto(e));
    }
    if (extras?.paymentUrl !== undefined) {
      this.paymentUrl = extras.paymentUrl;
    }
  }
}
