import { Inject, Injectable } from '@nestjs/common';

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
  ADDRESS_REPOSITORY,
  type IAddressRepository,
} from '@modules/addresses/domain/interfaces/address-repository.interface';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '@modules/products/domain/interfaces/product-repository.interface';
import {
  COUPON_REPOSITORY,
  type ICouponRepository,
} from '@modules/coupons/domain/interfaces/coupon-repository.interface';
import {
  COUPON_CALCULATOR,
  type CouponCalculator,
} from '@modules/coupons/domain/services/coupon-calculator';
import {
  EMAIL_SENDER,
  type IEmailSender,
} from '@modules/notifications/domain/interfaces/email-sender.interface';

import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderItem } from '@modules/orders/domain/entities/order-item.entity';
import { OrderEvent } from '@modules/orders/domain/entities/order-event.entity';
import { OrderStatus } from '@modules/orders/domain/enums/order-status.enum';
import { OrderChannel } from '@modules/orders/domain/enums/order-channel.enum';
import { PaymentMethod } from '@modules/orders/domain/enums/payment-method.enum';
import { ShippingMethod } from '@modules/orders/domain/enums/shipping-method.enum';
import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '@modules/orders/domain/interfaces/order-repository.interface';
import {
  ORDER_NUMBER_GENERATOR,
  type IOrderNumberGenerator,
} from '@modules/orders/domain/interfaces/order-number-generator.interface';
import { OrderResponseDto } from '@modules/orders/application/dtos/order-response.dto';

import { type CreatePosOrderDto } from '../dtos/create-pos-order.dto';

interface CurrentStaff {
  id: string;
  name: string;
}

@Injectable()
export class CreatePosOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(ORDER_NUMBER_GENERATOR)
    private readonly orderNumberGenerator: IOrderNumberGenerator,
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
    @Inject(COUPON_CALCULATOR)
    private readonly couponCalculator: CouponCalculator,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
  ) {}

  async execute(
    staff: CurrentStaff,
    dto: CreatePosOrderDto,
  ): Promise<OrderResponseDto> {
    if (!dto.items || dto.items.length === 0) {
      throw new DomainException(ErrorMessages.POS_ITEMS_EMPTY);
    }

    const channel = dto.channel ?? OrderChannel.POS;
    const isManualPayment = dto.paymentMethod !== PaymentMethod.MERCADOPAGO;
    const finalStatus = isManualPayment
      ? OrderStatus.PAID
      : OrderStatus.PENDING;

    const result = await this.unitOfWork.execute(
      async (ctx: TransactionContext) => {
        const orderRepo = this.orderRepository.withTransaction(ctx);
        const addressRepo = this.addressRepository.withTransaction(ctx);
        const productRepo = this.productRepository.withTransaction(ctx);
        const couponRepo = this.couponRepository.withTransaction(ctx);

        // 1. Validate products exist and are active + snapshot
        const productSnapshots: Array<{
          productId: string;
          name: string;
          slug: string;
          image: string | null;
          price: number;
          quantity: number;
        }> = [];
        let subtotal = 0;
        for (const item of dto.items) {
          const product = await productRepo.findById(item.productId);
          if (!product || !product.isActive) {
            throw new DomainNotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);
          }
          productSnapshots.push({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            image: product.images[0] ?? null,
            price: product.price,
            quantity: item.quantity,
          });
          subtotal += product.price * item.quantity;
        }

        // 2. Validate address if provided (WhatsApp con delivery)
        let shippingAddressSnapshot: Record<string, unknown> | null = null;
        if (dto.addressId) {
          const address = await addressRepo.findById(dto.addressId);
          if (!address) {
            throw new DomainNotFoundException(ErrorMessages.ADDRESS_NOT_FOUND);
          }
          shippingAddressSnapshot = {
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
        }

        // 3. Validate coupon if provided (mismo patrón que CreateOrderUseCase)
        let couponId: string | null = null;
        let couponCode: string | null = null;
        let couponDiscountAmount = 0;
        if (dto.couponCode) {
          const coupon = await couponRepo.findByCode(dto.couponCode);
          if (!coupon) {
            throw new DomainNotFoundException(ErrorMessages.COUPON_NOT_FOUND);
          }
          this.couponCalculator.validate(coupon, subtotal);
          if (coupon.maxUsesPerUser !== null) {
            const userUsageCount = await orderRepo.countUserOrdersWithCoupon(
              staff.id,
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

        // 4. POS no calcula shipping cost (pickup-equivalent — el back maneja
        //    delivery con WhatsApp en otro flow). En PR siguiente se evalúa
        //    si WhatsApp con delivery debe pagar shipping.
        const shippingCost = 0;
        const total = subtotal - couponDiscountAmount + shippingCost;

        // 5. Generate order number
        const orderNumber = await this.orderNumberGenerator.generate();

        // 6. Create order — siempre arranca PENDING en domain; transitionamos
        //    a PAID después si el método es manual (cash/yape/transfer).
        const order = Order.create({
          orderNumber,
          userId: staff.id,
          channel,
          paymentMethod: dto.paymentMethod,
          shippingMethod: ShippingMethod.PICKUP,
          subtotal,
          discount: couponDiscountAmount,
          shippingCost,
          total,
          couponId,
          couponCode,
          couponDiscount: couponDiscountAmount > 0 ? couponDiscountAmount : null,
          shippingAddressSnapshot,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail ?? '',
          customerPhone: dto.customerPhone ?? null,
          customerDocType: dto.customerDocType ?? null,
          customerDocNumber: dto.customerDocNumber ?? null,
          notes: dto.notes ?? null,
        });
        const savedOrder = await orderRepo.save(order);

        // 7. Create order items
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

        // 8. Atomic stock decrement (sorted by productId — deadlock prevention)
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

        // 9. Increment coupon uses
        if (couponId) {
          const incremented = await couponRepo.incrementUses(couponId);
          if (!incremented) {
            throw new DomainException(ErrorMessages.COUPON_LIMIT_REACHED);
          }
        }

        // 10. Si el pago es manual (cash/yape/transfer), transicionar a PAID
        //     directo. Si es MercadoPago, queda PENDING (cajero comparte el
        //     paymentUrl con el cliente).
        let finalOrder = savedOrder;
        if (isManualPayment) {
          const transitioned = await orderRepo.atomicStatusTransition(
            savedOrder.id,
            OrderStatus.PENDING,
            OrderStatus.PAID,
          );
          if (!transitioned) {
            throw new DomainException(ErrorMessages.ORDER_STATUS_CONFLICT);
          }
          // refrescar para devolver el status correcto
          const refreshed = await orderRepo.findById(savedOrder.id);
          if (refreshed) finalOrder = refreshed;
        }

        // 11. Order event
        const eventDescription =
          channel === OrderChannel.WHATSAPP
            ? `Venta WhatsApp registrada por ${staff.name}`
            : `Venta POS registrada por ${staff.name}`;
        const event = OrderEvent.create({
          orderId: savedOrder.id,
          status: finalStatus,
          description: eventDescription,
          performedBy: staff.id,
        });
        await orderRepo.saveEvent(event);

        return { order: finalOrder, items: orderItems };
      },
    );

    // 12. Email confirmation (fire-and-forget, fuera de transacción)
    if (result.order.customerEmail) {
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
    }

    return new OrderResponseDto(result.order, {
      items: result.items,
      paymentUrl: null,
    });
  }
}
