import { BaseEntity } from '@shared/domain/entities/base.entity';
import { DomainException } from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';

import { OrderStatus } from '../enums/order-status.enum';
import { OrderChannel } from '../enums/order-channel.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { CustomerDocType } from '../enums/customer-doc-type.enum';
import { ShippingMethod } from '../enums/shipping-method.enum';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.REFUNDED,
  ],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

export class Order extends BaseEntity {
  private _orderNumber: string;
  private _userId: string | null;
  private _staffId: string | null;
  private _channel: OrderChannel;
  private _status: OrderStatus;
  private _paymentMethod: PaymentMethod;
  private _shippingMethod: ShippingMethod;
  private _subtotal: number;
  private _discount: number;
  private _shippingCost: number;
  private _total: number;
  private _couponId: string | null;
  private _couponCode: string | null;
  private _couponDiscount: number | null;
  private _shippingAddressSnapshot: Record<string, unknown> | null;
  private _customerName: string;
  private _customerEmail: string;
  private _customerPhone: string | null;
  private _customerDocType: CustomerDocType | null;
  private _customerDocNumber: string | null;
  private _notes: string | null;
  private _adminNotes: string | null;

  private constructor(
    id: string,
    orderNumber: string,
    userId: string | null,
    staffId: string | null,
    channel: OrderChannel,
    status: OrderStatus,
    paymentMethod: PaymentMethod,
    shippingMethod: ShippingMethod,
    subtotal: number,
    discount: number,
    shippingCost: number,
    total: number,
    couponId: string | null,
    couponCode: string | null,
    couponDiscount: number | null,
    shippingAddressSnapshot: Record<string, unknown> | null,
    customerName: string,
    customerEmail: string,
    customerPhone: string | null,
    customerDocType: CustomerDocType | null,
    customerDocNumber: string | null,
    notes: string | null,
    adminNotes: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._orderNumber = orderNumber;
    this._userId = userId;
    this._staffId = staffId;
    this._channel = channel;
    this._status = status;
    this._paymentMethod = paymentMethod;
    this._shippingMethod = shippingMethod;
    this._subtotal = subtotal;
    this._discount = discount;
    this._shippingCost = shippingCost;
    this._total = total;
    this._couponId = couponId;
    this._couponCode = couponCode;
    this._couponDiscount = couponDiscount;
    this._shippingAddressSnapshot = shippingAddressSnapshot;
    this._customerName = customerName;
    this._customerEmail = customerEmail;
    this._customerPhone = customerPhone;
    this._customerDocType = customerDocType;
    this._customerDocNumber = customerDocNumber;
    this._notes = notes;
    this._adminNotes = adminNotes;
  }

  static create(props: {
    orderNumber: string;
    userId?: string | null;
    staffId?: string | null;
    channel?: OrderChannel;
    paymentMethod: PaymentMethod;
    shippingMethod: ShippingMethod;
    subtotal: number;
    discount: number;
    shippingCost: number;
    total: number;
    couponId?: string | null;
    couponCode?: string | null;
    couponDiscount?: number | null;
    shippingAddressSnapshot: Record<string, unknown> | null;
    customerName: string;
    customerEmail: string;
    customerPhone?: string | null;
    customerDocType?: CustomerDocType | null;
    customerDocNumber?: string | null;
    notes?: string | null;
  }): Order {
    const channel = props.channel ?? OrderChannel.ONLINE;

    const userId = props.userId ?? null;
    const staffId = props.staffId ?? null;
    const hasUser = userId !== null && userId !== '';
    const hasStaff = staffId !== null && staffId !== '';
    if (hasUser === hasStaff) {
      throw new DomainException(ErrorMessages.ORDER_USER_OR_STAFF_REQUIRED);
    }

    if (channel === OrderChannel.ONLINE && !props.shippingAddressSnapshot) {
      throw new DomainException(ErrorMessages.ADDRESS_NOT_FOUND);
    }

    if (props.customerDocType && !props.customerDocNumber) {
      throw new DomainException(ErrorMessages.POS_INVALID_DOC_NUMBER);
    }
    if (props.customerDocNumber && !props.customerDocType) {
      throw new DomainException(ErrorMessages.POS_INVALID_DOC_NUMBER);
    }
    if (props.customerDocType && props.customerDocNumber) {
      const expectedLength =
        props.customerDocType === CustomerDocType.DNI ? 8 : 11;
      if (
        props.customerDocNumber.length !== expectedLength ||
        !/^\d+$/.test(props.customerDocNumber)
      ) {
        throw new DomainException(ErrorMessages.POS_INVALID_DOC_NUMBER);
      }
    }

    return new Order(
      undefined!,
      props.orderNumber,
      hasUser ? userId : null,
      hasStaff ? staffId : null,
      channel,
      OrderStatus.PENDING,
      props.paymentMethod,
      props.shippingMethod,
      props.subtotal,
      props.discount,
      props.shippingCost,
      props.total,
      props.couponId ?? null,
      props.couponCode ?? null,
      props.couponDiscount ?? null,
      props.shippingAddressSnapshot,
      props.customerName,
      props.customerEmail,
      props.customerPhone ?? null,
      props.customerDocType ?? null,
      props.customerDocNumber ?? null,
      props.notes ?? null,
      null,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    orderNumber: string;
    userId: string | null;
    staffId: string | null;
    channel: OrderChannel;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    shippingMethod: ShippingMethod;
    subtotal: number;
    discount: number;
    shippingCost: number;
    total: number;
    couponId: string | null;
    couponCode: string | null;
    couponDiscount: number | null;
    shippingAddressSnapshot: Record<string, unknown> | null;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    customerDocType: CustomerDocType | null;
    customerDocNumber: string | null;
    notes: string | null;
    adminNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Order {
    return new Order(
      props.id,
      props.orderNumber,
      props.userId,
      props.staffId,
      props.channel,
      props.status,
      props.paymentMethod,
      props.shippingMethod,
      props.subtotal,
      props.discount,
      props.shippingCost,
      props.total,
      props.couponId,
      props.couponCode,
      props.couponDiscount,
      props.shippingAddressSnapshot,
      props.customerName,
      props.customerEmail,
      props.customerPhone,
      props.customerDocType,
      props.customerDocNumber,
      props.notes,
      props.adminNotes,
      props.createdAt,
      props.updatedAt,
    );
  }

  get orderNumber(): string {
    return this._orderNumber;
  }
  get userId(): string | null {
    return this._userId;
  }
  get staffId(): string | null {
    return this._staffId;
  }
  get channel(): OrderChannel {
    return this._channel;
  }
  get status(): OrderStatus {
    return this._status;
  }
  get paymentMethod(): PaymentMethod {
    return this._paymentMethod;
  }
  get shippingMethod(): ShippingMethod {
    return this._shippingMethod;
  }
  get subtotal(): number {
    return this._subtotal;
  }
  get discount(): number {
    return this._discount;
  }
  get shippingCost(): number {
    return this._shippingCost;
  }
  get total(): number {
    return this._total;
  }
  get couponId(): string | null {
    return this._couponId;
  }
  get couponCode(): string | null {
    return this._couponCode;
  }
  get couponDiscount(): number | null {
    return this._couponDiscount;
  }
  get shippingAddressSnapshot(): Record<string, unknown> | null {
    return this._shippingAddressSnapshot;
  }
  get customerName(): string {
    return this._customerName;
  }
  get customerEmail(): string {
    return this._customerEmail;
  }
  get customerPhone(): string | null {
    return this._customerPhone;
  }
  get customerDocType(): CustomerDocType | null {
    return this._customerDocType;
  }
  get customerDocNumber(): string | null {
    return this._customerDocNumber;
  }
  get notes(): string | null {
    return this._notes;
  }
  get adminNotes(): string | null {
    return this._adminNotes;
  }

  transitionTo(newStatus: OrderStatus): void {
    const allowed = VALID_TRANSITIONS[this._status];
    if (!allowed.includes(newStatus)) {
      throw new DomainException(ErrorMessages.ORDER_INVALID_TRANSITION);
    }
    this._status = newStatus;
    this.markUpdated();
  }

  updateNotes(adminNotes: string): void {
    this._adminNotes = adminNotes;
    this.markUpdated();
  }
}
