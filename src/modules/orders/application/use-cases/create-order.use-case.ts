import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DomainException, DomainForbiddenException, DomainNotFoundException } from '@shared/domain/exceptions/index.js';
import { ErrorMessages } from '@shared/domain/constants/error-messages.js';
import { UNIT_OF_WORK, type IUnitOfWork, type TransactionContext } from '@shared/domain/interfaces/unit-of-work.interface.js';

import { CART_REPOSITORY, type ICartRepository } from '@modules/cart/domain/interfaces/cart-repository.interface.js';
import { ADDRESS_REPOSITORY, type IAddressRepository } from '@modules/addresses/domain/interfaces/address-repository.interface.js';
import { PRODUCT_REPOSITORY, type IProductRepository } from '@modules/products/domain/interfaces/product-repository.interface.js';
import { USER_REPOSITORY, type IUserRepository } from '@modules/users/domain/interfaces/user-repository.interface.js';
import { COUPON_REPOSITORY, type ICouponRepository } from '@modules/coupons/domain/interfaces/coupon-repository.interface.js';
import { COUPON_CALCULATOR, type CouponCalculator } from '@modules/coupons/domain/services/coupon-calculator.js';
import { PAYMENT_PROVIDER, type IPaymentProvider } from '@modules/payments/domain/interfaces/payment-provider.interface.js';
import { EMAIL_SENDER, type IEmailSender } from '@modules/notifications/domain/interfaces/email-sender.interface.js';

import { Order } from '../../domain/entities/order.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { OrderEvent } from '../../domain/entities/order-event.entity.js';
import { OrderStatus } from '../../domain/enums/order-status.enum.js';
import { ORDER_REPOSITORY, type IOrderRepository } from '../../domain/interfaces/order-repository.interface.js';
import { ORDER_NUMBER_GENERATOR, type IOrderNumberGenerator } from '../../domain/interfaces/order-number-generator.interface.js';
import { type CreateOrderDto } from '../dtos/create-order.dto.js';
import { OrderResponseDto } from '../dtos/order-response.dto.js';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: IOrderRepository,
    @Inject(ORDER_NUMBER_GENERATOR) private readonly orderNumberGenerator: IOrderNumberGenerator,
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
    @Inject(ADDRESS_REPOSITORY) private readonly addressRepository: IAddressRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(COUPON_REPOSITORY) private readonly couponRepository: ICouponRepository,
    @Inject(COUPON_CALCULATOR) private readonly couponCalculator: CouponCalculator,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: IPaymentProvider,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly configService: ConfigService,
  ) {}

  async execute(userId: string, dto: CreateOrderDto): Promise<OrderResponseDto> {
    const result = await this.unitOfWork.execute(async (ctx: TransactionContext) => {
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
          const userUsageCount = await orderRepo.countUserOrdersWithCoupon(userId, coupon.id);
          if (userUsageCount >= coupon.maxUsesPerUser) {
            throw new DomainException(ErrorMessages.COUPON_USER_LIMIT_REACHED);
          }
        }

        couponDiscountAmount = this.couponCalculator.calculateDiscount(coupon, subtotal);
        couponId = coupon.id;
        couponCode = coupon.code;
      }

      // 6-7. Calculate totals
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new DomainNotFoundException(ErrorMessages.USER_NOT_FOUND);
      }

      const shippingCost = this.configService.get<number>('SHIPPING_FLAT_RATE', 0);
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
        subtotal,
        discount: couponDiscountAmount,
        shippingCost,
        total,
        couponId,
        couponCode,
        couponDiscount: couponDiscountAmount > 0 ? couponDiscountAmount : null,
        shippingAddressSnapshot,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone ?? null,
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
      const sortedSnapshots = [...productSnapshots].sort((a, b) => a.productId.localeCompare(b.productId));
      for (const snap of sortedSnapshots) {
        const success = await orderRepo.atomicStockDecrement(snap.productId, snap.quantity);
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
    });

    // 13. Create MercadoPago preference (outside transaction)
    let paymentUrl: string | null = null;
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

    this.emailSender.sendOrderConfirmation({
      orderNumber: result.order.orderNumber,
      customerName: result.order.customerName,
      email: result.order.customerEmail,
      items: result.items.map((i) => ({ name: i.productName, quantity: i.quantity, unitPrice: i.unitPrice })),
      total: result.order.total,
    }).catch(() => {});

    return new OrderResponseDto(result.order, {
      items: result.items,
      paymentUrl,
    });
  }
}
