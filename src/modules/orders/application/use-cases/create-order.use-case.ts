import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  DomainException,
  DomainForbiddenException,
  DomainNotFoundException,
} from '@shared/domain/exceptions/index';
import { ErrorMessages } from '@shared/domain/constants/error-messages';
import {
  UNIT_OF_WORK,
  type IUnitOfWork,
  type TransactionContext,
} from '@shared/domain/interfaces/unit-of-work.interface';

import {
  CART_REPOSITORY,
  type ICartRepository,
} from '@modules/cart/domain/interfaces/cart-repository.interface';
import {
  ADDRESS_REPOSITORY,
  type IAddressRepository,
} from '@modules/addresses/domain/interfaces/address-repository.interface';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '@modules/products/domain/interfaces/product-repository.interface';
import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '@modules/customers/domain/interfaces/customer-repository.interface';
import {
  COUPON_REPOSITORY,
  type ICouponRepository,
} from '@modules/coupons/domain/interfaces/coupon-repository.interface';
import {
  COUPON_CALCULATOR,
  type CouponCalculator,
} from '@modules/coupons/domain/services/coupon-calculator';
import {
  PAYMENT_PROVIDER,
  type IPaymentProvider,
} from '@modules/payments/domain/interfaces/payment-provider.interface';
import {
  EMAIL_SENDER,
  type IEmailSender,
} from '@modules/notifications/domain/interfaces/email-sender.interface';

import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderEvent } from '../../domain/entities/order-event.entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { PaymentMethod } from '../../domain/enums/payment-method.enum';
import { ShippingMethod } from '../../domain/enums/shipping-method.enum';
import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '../../domain/interfaces/order-repository.interface';
import {
  ORDER_NUMBER_GENERATOR,
  type IOrderNumberGenerator,
} from '../../domain/interfaces/order-number-generator.interface';
import { type CreateOrderDto } from '../dtos/create-order.dto';
import { OrderResponseDto } from '../dtos/order-response.dto';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(ORDER_NUMBER_GENERATOR)
    private readonly orderNumberGenerator: IOrderNumberGenerator,
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
    @Inject(COUPON_CALCULATOR)
    private readonly couponCalculator: CouponCalculator,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: IPaymentProvider,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const result = await this.unitOfWork.execute(
      async (ctx: TransactionContext) => {
        const orderRepo = this.orderRepository.withTransaction(ctx);
        const cartRepo = this.cartRepository.withTransaction(ctx);
        const addressRepo = this.addressRepository.withTransaction(ctx);
        const productRepo = this.productRepository.withTransaction(ctx);
        const couponRepo = this.couponRepository.withTransaction(ctx);

        // 1. Validate cart not empty
        const cart = await cartRepo.findOrCreateByUserId(userId);
        const cartItems = await cartRepo.findItemsByCartId(cart.id);
        if (cartItems.length === 0) {
          throw new DomainException(ErrorMessages.CART_EMPTY);
        }

        // 2. Validate address belongs to user
        const address = await addressRepo.findById(dto.addressId);
        if (!address) {
          throw new DomainNotFoundException(ErrorMessages.ADDRESS_NOT_FOUND);
        }
        if (address.userId !== userId) {
          throw new DomainForbiddenException(ErrorMessages.ADDRESS_NOT_OWNED);
        }

        // 3-4. Validate coupon if provided
        let couponId: string | null = null;
        let couponCode: string | null = null;
        let couponDiscountAmount = 0;

        // 5. Validate stock + snapshot products
        const productSnapshots: Array<{
          productId: string;
          name: string;
          slug: string;
          image: string | null;
          price: number;
          quantity: number;
        }> = [];

        let subtotal = 0;
        for (const cartItem of cartItems) {
          const product = await productRepo.findById(cartItem.productId);
          if (!product || !product.isActive) {
            throw new DomainNotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);
          }
          productSnapshots.push({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            image: product.images[0] ?? null,
            price: product.price,
            quantity: cartItem.quantity,
          });
          subtotal += product.price * cartItem.quantity;
        }

        // 3-4. Coupon validation (after subtotal calculated)
        if (dto.couponCode) {
          const coupon = await couponRepo.findByCode(dto.couponCode);
          if (!coupon) {
            throw new DomainNotFoundException(ErrorMessages.COUPON_NOT_FOUND);
          }

          this.couponCalculator.validate(coupon, subtotal);

          // Check per-user usage
          if (coupon.maxUsesPerUser !== null) {
            const userUsageCount = await orderRepo.countUserOrdersWithCoupon(
              userId,
              coupon.id,
            );
            if (userUsageCount >= coupon.maxUsesPerUser) {
              throw new DomainException(
                ErrorMessages.COUPON_USER_LIMIT_REACHED,
              );
            }
          }

          couponDiscountAmount = this.couponCalculator.calculateDiscount(
            coupon,
            subtotal,
          );
          couponId = coupon.id;
          couponCode = coupon.code;
        }

        // 6-7. Calculate totals
        const customer = await this.customerRepository.findById(userId);
        if (!customer) {
          throw new DomainNotFoundException(ErrorMessages.CUSTOMER_NOT_FOUND);
        }

        const shippingCost = this.resolveShippingCost(dto.shippingMethod);
        const total = subtotal - couponDiscountAmount + shippingCost;

        // 6. Address snapshot
        const shippingAddressSnapshot: Record<string, unknown> = {
          label: address.label,
          recipientName: address.recipientName,
          phone: address.phone,
          street: address.street,
          district: address.district,
          city: address.city,
          department: address.department,
          zipCode: address.zipCode,
          reference: address.reference,
        };

        // 8. Generate order number
        const orderNumber = await this.orderNumberGenerator.generate();

        // 9. Create order
        const order = Order.create({
          orderNumber,
          userId,
          paymentMethod: dto.paymentMethod,
          shippingMethod: dto.shippingMethod,
          subtotal,
          discount: couponDiscountAmount,
          shippingCost,
          total,
          couponId,
          couponCode,
          couponDiscount:
            couponDiscountAmount > 0 ? couponDiscountAmount : null,
          shippingAddressSnapshot,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone ?? null,
          customerDocType: dto.customerDocType ?? null,
          customerDocNumber: dto.customerDocNumber ?? null,
          notes: dto.notes,
        });

        const savedOrder = await orderRepo.save(order);

        // 9. Create order items
        const orderItems: OrderItem[] = [];
        for (const snap of productSnapshots) {
          const item = OrderItem.create({
            orderId: savedOrder.id,
            productId: snap.productId,
            productName: snap.name,
            productSlug: snap.slug,
            productImage: snap.image,
            unitPrice: snap.price,
            quantity: snap.quantity,
          });
          const savedItem = await orderRepo.saveItem(item);
          orderItems.push(savedItem);
        }

        // 9. Create order event
        const event = OrderEvent.create({
          orderId: savedOrder.id,
          status: OrderStatus.PENDING,
          description: 'Orden creada',
        });
        await orderRepo.saveEvent(event);

        // 10. Atomic stock decrement (ordered by productId to prevent deadlocks)
        const sortedSnapshots = [...productSnapshots].sort((a, b) =>
          a.productId.localeCompare(b.productId),
        );
        for (const snap of sortedSnapshots) {
          const success = await orderRepo.atomicStockDecrement(
            snap.productId,
            snap.quantity,
          );
          if (!success) {
            throw new DomainException(ErrorMessages.INSUFFICIENT_STOCK);
          }
        }

        // 11. Increment coupon uses
        if (couponId) {
          const incremented = await couponRepo.incrementUses(couponId);
          if (!incremented) {
            throw new DomainException(ErrorMessages.COUPON_LIMIT_REACHED);
          }
        }

        // 12. Clear cart
        await cartRepo.clearCart(cart.id);

        return { order: savedOrder, items: orderItems };
      },
    );

    // 13. Create MercadoPago preference (outside transaction)
    // Only for paymentMethod = mercadopago. Other methods (cash / yape_plin / bank_transfer)
    // are verified manually by admin and stay pending until then.
    let paymentUrl: string | null = null;
    if (dto.paymentMethod === PaymentMethod.MERCADOPAGO) {
      try {
        const preference = await this.paymentProvider.createPreference({
          id: result.order.id,
          orderNumber: result.order.orderNumber,
          items: result.items.map((i) => ({
            title: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          total: result.order.total,
          payerEmail: result.order.customerEmail,
        });
        paymentUrl = preference.paymentUrl;
      } catch {
        // Order stays pending without paymentUrl — retry via /orders/:id/retry-payment
      }
    }

    this.emailSender
      .sendOrderConfirmation({
        orderNumber: result.order.orderNumber,
        customerName: result.order.customerName,
        email: result.order.customerEmail,
        items: result.items.map((i) => ({
          name: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        total: result.order.total,
      })
      .catch(() => {});

    return new OrderResponseDto(result.order, {
      items: result.items,
      paymentUrl,
    });
  }

  private resolveShippingCost(method: ShippingMethod): number {
    const envKey: Record<ShippingMethod, string> = {
      [ShippingMethod.STANDARD]: 'SHIPPING_STANDARD_COST',
      [ShippingMethod.EXPRESS]: 'SHIPPING_EXPRESS_COST',
      [ShippingMethod.PICKUP]: 'SHIPPING_PICKUP_COST',
    };
    const fallback: Record<ShippingMethod, number> = {
      [ShippingMethod.STANDARD]: 1500,
      [ShippingMethod.EXPRESS]: 3000,
      [ShippingMethod.PICKUP]: 0,
    };
    return this.configService.get<number>(envKey[method], fallback[method]);
  }
}
