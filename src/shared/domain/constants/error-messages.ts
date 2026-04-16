export const ErrorMessages = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
  REFRESH_TOKEN_REUSED: 'Refresh token reuse detected, all sessions revoked',
  INVALID_RESET_TOKEN: 'Invalid or expired password reset token',
  // Users
  USER_NOT_FOUND: 'User not found',
  USER_SUSPENDED: 'Account is suspended',
  WRONG_PASSWORD: 'Current password is incorrect',
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
} as const;
