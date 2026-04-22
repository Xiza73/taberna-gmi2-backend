# Error Handling Patterns

## Exception Hierarchy

### Architecture (framework-agnostic)

```
DomainException (base)                → 400 Bad Request
  ├── DomainUnauthorizedException     → 401 Unauthorized
  ├── DomainNotFoundException         → 404 Not Found
  ├── DomainForbiddenException        → 403 Forbidden
  └── DomainConflictException         → 409 Conflict
```

Domain exceptions extend native `Error`, not `HttpException`. The filter bridges domain → HTTP.

### NestJS Implementation

```typescript
// Base
export class DomainException extends Error {
  constructor(message: string) { super(message); this.name = 'DomainException'; }
}

// Unauthorized
export class DomainUnauthorizedException extends DomainException {
  constructor(message = 'Unauthorized') { super(message); this.name = 'DomainUnauthorizedException'; }
}

// Not Found (auto-formatted message)
export class DomainNotFoundException extends DomainException {
  constructor(entity: string, id?: string) {
    super(id ? `${entity} with id ${id} not found` : `${entity} not found`);
    this.name = 'DomainNotFoundException';
  }
}

// Forbidden (default message)
export class DomainForbiddenException extends DomainException {
  constructor(message = 'Access denied') { super(message); this.name = 'DomainForbiddenException'; }
}

// Conflict
export class DomainConflictException extends DomainException {
  constructor(message: string) { super(message); this.name = 'DomainConflictException'; }
}
```

Barrel export: `import { DomainException, DomainNotFoundException } from '@shared/domain/exceptions';`

---

## Exception Filter

```typescript
@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    // Ordered from most specific to least specific
    if (exception instanceof DomainUnauthorizedException) { status = 401; }
    else if (exception instanceof DomainNotFoundException) { status = 404; }
    else if (exception instanceof DomainForbiddenException) { status = 403; }
    else if (exception instanceof DomainConflictException) { status = 409; }
    else if (exception instanceof DomainException) { status = 400; }
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      // Handle ValidationPipe array-of-messages format
      const exceptionResponse = exception.getResponse() as any;
      message = Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message
        : exceptionResponse.message || exceptionResponse;
    }
    else { status = 500; this.logger.error('Unhandled', exception); }

    response.status(status).json(BaseResponse.fail(message));
  }
}
```

Only 500 errors are logged. Domain exceptions are expected business errors.

---

## Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "statusCode": 400
}
```

Mirrors success envelope: `{ success: true, data: {...} }`.

---

## ErrorMessages Constants

```typescript
export const ErrorMessages = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
  REFRESH_TOKEN_REUSED: 'Refresh token reuse detected, all sessions revoked',
  INVALID_RESET_TOKEN: 'Invalid or expired password reset token',
  // Customers
  CUSTOMER_NOT_FOUND: 'Customer not found',
  CUSTOMER_SUSPENDED: 'Customer account is suspended',
  WRONG_PASSWORD: 'Current password is incorrect',
  // Staff
  STAFF_NOT_FOUND: 'Staff member not found',
  STAFF_SUSPENDED: 'Staff account is suspended',
  STAFF_EMAIL_ALREADY_EXISTS: 'A staff member with this email already exists',
  STAFF_CANNOT_CHANGE_OWN_ROLE: 'Cannot change your own role',
  STAFF_CANNOT_SUSPEND_SELF: 'Cannot suspend yourself',
  STAFF_LAST_SUPER_ADMIN: 'Cannot remove the last active super admin',
  STAFF_INSUFFICIENT_ROLE: 'Insufficient role to perform this action',
  // Invitations
  INVITATION_NOT_FOUND: 'Invitation not found',
  INVITATION_EXPIRED: 'Invitation has expired',
  INVITATION_ALREADY_ACCEPTED: 'Invitation has already been accepted',
  INVITATION_REVOKED: 'Invitation has been revoked',
  INVITATION_EMAIL_EXISTS: 'A staff member with this email already exists',
  INVITATION_CANNOT_INVITE_ROLE: 'You cannot invite staff with this role',
  // Categories
  CATEGORY_NOT_FOUND: 'Category not found',
  CATEGORY_HAS_PRODUCTS: 'Cannot delete category with products',
  CATEGORY_HAS_SUBCATEGORIES: 'Cannot delete category with subcategories',
  // Products
  PRODUCT_NOT_FOUND: 'Product not found',
  INSUFFICIENT_STOCK: 'Insufficient stock',
  // Banners
  BANNER_NOT_FOUND: 'Banner not found',
  // Cart
  CART_EMPTY: 'Cart is empty',
  CART_ITEM_NOT_FOUND: 'Cart item not found',
  // Wishlist
  WISHLIST_ITEM_ALREADY_EXISTS: 'Product already in wishlist',
  WISHLIST_ITEM_NOT_FOUND: 'Product not in wishlist',
  // Coupons
  COUPON_NOT_FOUND: 'Coupon not found',
  COUPON_EXPIRED: 'Coupon has expired',
  COUPON_LIMIT_REACHED: 'Coupon usage limit reached',
  COUPON_USER_LIMIT_REACHED: 'You have already used this coupon',
  COUPON_MIN_PURCHASE: 'Minimum purchase amount not reached',
  COUPON_INACTIVE: 'Coupon is not active',
  // Orders
  ORDER_NOT_FOUND: 'Order not found',
  ORDER_CANNOT_CANCEL: 'Order can only be cancelled while pending',
  ORDER_EXPIRED: 'Order expired due to unpaid status',
  ORDER_INVALID_TRANSITION: 'Invalid order status transition',
  ORDER_STATUS_CONFLICT: 'Order status was modified concurrently, please retry',
  // Payments
  PAYMENT_ALREADY_PROCESSED: 'Payment has already been processed',
  PAYMENT_VERIFICATION_FAILED: 'Could not verify payment status',
  PAYMENT_NOT_FOUND: 'Payment not found',
  PAYMENT_INVALID_SIGNATURE: 'Invalid webhook signature',
  PAYMENT_AMOUNT_MISMATCH: 'Payment amount does not match order total',
  ORDER_NOT_PENDING_PAYMENT: 'Order is not pending payment',
  // Shipping
  SHIPMENT_NOT_FOUND: 'Shipment not found',
  SHIPMENT_ALREADY_EXISTS: 'Order already has a shipment',
  // Reviews
  REVIEW_NOT_FOUND: 'Review not found',
  REVIEW_ALREADY_EXISTS: 'You already reviewed this product',
  REVIEW_NOT_PURCHASED: 'You can only review products you have purchased',
  // Addresses
  ADDRESS_NOT_FOUND: 'Address not found',
  ADDRESS_NOT_OWNED: 'Address does not belong to this user',
  ADDRESS_LIMIT_REACHED: 'Maximum of 10 addresses per user reached',
  // Uniqueness violations
  SLUG_ALREADY_EXISTS: 'Slug already exists',
  SKU_ALREADY_EXISTS: 'SKU already exists',
  COUPON_CODE_ALREADY_EXISTS: 'Coupon code already exists',
  // Uploads
  UPLOAD_FAILED: 'Image upload failed',
  UPLOAD_INVALID_FORMAT: 'Invalid image format. Allowed: jpg, png, webp',
  UPLOAD_TOO_LARGE: 'Image exceeds maximum size of 5MB',
  // Invoicing
  INVOICE_ALREADY_EXISTS: 'Invoice already exists for this order',
  INVOICE_ORDER_NOT_PAID: 'Cannot generate invoice for unpaid order',
  INVOICE_FACTURA_REQUIRES_RUC: 'Factura requires RUC document',
  INVOICE_CANCEL_EXPIRED: 'Invoice can only be cancelled within 72 hours',
  INVOICE_NOT_FOUND: 'Invoice not found',
  // POS
  POS_ITEMS_EMPTY: 'At least one item is required',
  POS_INVALID_DOC_NUMBER: 'Invalid document number for the specified type',
  POS_CASH_REGISTER_ALREADY_OPEN: 'You already have an open cash register',
  POS_CASH_REGISTER_NOT_OPEN: 'No open cash register found',
  POS_CASH_REGISTER_NOT_FOUND: 'Cash register not found',
  POS_ORDER_NOT_POS: 'This order is not a POS/WhatsApp order',
  POS_ORDER_CANNOT_CANCEL: 'Only paid POS orders can be cancelled',
  POS_ORDER_CANNOT_REFUND: 'Only paid or processing POS orders can be refunded',
  POS_REFUND_QUANTITY_EXCEEDED: 'Refund quantity exceeds purchased quantity',
} as const;
```

Usage: `throw new DomainForbiddenException(ErrorMessages.CUSTOMER_SUSPENDED);`
Tests: `await expect(fn).rejects.toThrow(ErrorMessages.CUSTOMER_SUSPENDED);`

---

## Error Handling by Layer

| Layer | Pattern |
|---|---|
| Domain | Throws `DomainException` subclasses; uses `ErrorMessages` constants |
| Application | Lets exceptions propagate (no try-catch) |
| Infrastructure | Catches external service errors, logs, re-throws or returns null |
| Presentation | Global `GlobalExceptionFilter` maps all exceptions to HTTP responses |
