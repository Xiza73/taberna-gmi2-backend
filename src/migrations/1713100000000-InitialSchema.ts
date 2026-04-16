import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class InitialSchema1713100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Extensions ───────────────────────────────────────────────
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    // ─── ENUM Types ───────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'banner_position_enum') THEN
          CREATE TYPE banner_position_enum AS ENUM ('hero', 'secondary', 'footer');
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coupon_type_enum') THEN
          CREATE TYPE coupon_type_enum AS ENUM ('percentage', 'fixed_amount');
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_enum') THEN
          CREATE TYPE order_status_enum AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
          CREATE TYPE payment_status_enum AS ENUM ('pending', 'approved', 'rejected', 'refunded');
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'carrier_enum') THEN
          CREATE TYPE carrier_enum AS ENUM ('shalom', 'serpost', 'olva', 'dhl', 'other');
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_status_enum') THEN
          CREATE TYPE shipment_status_enum AS ENUM ('shipped', 'in_transit', 'delivered');
        END IF;
      END $$
    `);

    // ─── 1. users (no FK dependencies) ────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(20) NOT NULL DEFAULT 'customer',
        is_active BOOLEAN NOT NULL DEFAULT true,
        reset_password_token VARCHAR(255),
        reset_password_expires TIMESTAMPTZ,
        google_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // ─── 2. categories (self-referencing FK) ──────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        parent_id UUID,
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // ─── 3. products (FK → categories) ───────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        price INTEGER NOT NULL,
        compare_at_price INTEGER,
        sku VARCHAR(100) UNIQUE,
        stock INTEGER NOT NULL DEFAULT 0,
        images JSONB NOT NULL DEFAULT '[]',
        category_id UUID NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        average_rating NUMERIC(3, 2),
        total_reviews INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
      )
    `);

    // ─── 4. banners (standalone) ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        link_url VARCHAR(500),
        position banner_position_enum NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        start_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // ─── 5. coupons (standalone) ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id UUID PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        type coupon_type_enum NOT NULL,
        value INTEGER NOT NULL,
        min_purchase INTEGER,
        max_discount INTEGER,
        max_uses INTEGER,
        max_uses_per_user INTEGER DEFAULT 1,
        current_uses INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // ─── 6. refresh_tokens (FK → users) ──────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        family_id UUID NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        is_revoked BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ─── 7. addresses (FK → users) ──────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        label VARCHAR(100) NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        street VARCHAR(500) NOT NULL,
        district VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        zip_code VARCHAR(20),
        reference VARCHAR(500),
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ─── 8. carts (FK → users) ──────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ─── 9. cart_items (FK → carts, products) ────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY,
        cart_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // ─── 10. wishlist_items (FK → users, products) ──────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        product_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_wishlist_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_wishlist_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // ─── 11. orders (FK → users, coupons optional) ──────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY,
        order_number VARCHAR NOT NULL UNIQUE,
        user_id UUID NOT NULL,
        status order_status_enum NOT NULL DEFAULT 'pending',
        subtotal INTEGER NOT NULL,
        discount INTEGER NOT NULL DEFAULT 0,
        shipping_cost INTEGER NOT NULL DEFAULT 0,
        total INTEGER NOT NULL,
        coupon_id UUID,
        coupon_code VARCHAR,
        coupon_discount INTEGER,
        shipping_address_snapshot JSONB NOT NULL,
        customer_name VARCHAR NOT NULL,
        customer_email VARCHAR NOT NULL,
        customer_phone VARCHAR,
        notes TEXT,
        admin_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
        CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
      )
    `);

    // ─── 12. order_items (FK → orders, products) ────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY,
        order_id UUID NOT NULL,
        product_id UUID NOT NULL,
        product_name VARCHAR NOT NULL,
        product_slug VARCHAR NOT NULL,
        product_image VARCHAR,
        unit_price INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      )
    `);

    // ─── 13. order_events (FK → orders) ─────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_events (
        id UUID PRIMARY KEY,
        order_id UUID NOT NULL,
        status order_status_enum NOT NULL,
        description VARCHAR NOT NULL,
        performed_by UUID,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_order_events_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_order_events_performed_by FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // ─── 14. payments (FK → orders) ─────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY,
        order_id UUID NOT NULL,
        external_id VARCHAR,
        preference_id VARCHAR,
        method VARCHAR,
        status payment_status_enum NOT NULL DEFAULT 'pending',
        amount INTEGER NOT NULL,
        paid_at TIMESTAMPTZ,
        raw_response JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
      )
    `);

    // ─── 15. shipments (FK → orders) ────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id UUID PRIMARY KEY,
        order_id UUID NOT NULL UNIQUE,
        carrier carrier_enum NOT NULL,
        tracking_number VARCHAR NOT NULL,
        tracking_url VARCHAR NOT NULL,
        status shipment_status_enum NOT NULL DEFAULT 'shipped',
        shipped_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_shipments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
      )
    `);

    // ─── 16. reviews (FK → users, products, orders) ─────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        product_id UUID NOT NULL,
        order_id UUID NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        is_approved BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
        CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
      )
    `);

    // ─── 17. order_number_counters (standalone utility table) ────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_number_counters (
        date DATE PRIMARY KEY,
        last_number INTEGER NOT NULL DEFAULT 0
      )
    `);

    // ═══════════════════════════════════════════════════════════════
    // UNIQUE CONSTRAINTS
    // ═══════════════════════════════════════════════════════════════
    await queryRunner.query(`
      ALTER TABLE cart_items ADD CONSTRAINT uq_cart_items_cart_product UNIQUE (cart_id, product_id)
    `);
    await queryRunner.query(`
      ALTER TABLE reviews ADD CONSTRAINT uq_reviews_user_product UNIQUE (user_id, product_id)
    `);
    await queryRunner.query(`
      ALTER TABLE wishlist_items ADD CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id)
    `);
    await queryRunner.query(`
      ALTER TABLE payments ADD CONSTRAINT uq_payments_external_id UNIQUE (external_id)
    `);

    // ═══════════════════════════════════════════════════════════════
    // CHECK CONSTRAINTS
    // ═══════════════════════════════════════════════════════════════

    // products
    await queryRunner.query(`ALTER TABLE products ADD CONSTRAINT chk_products_price CHECK (price > 0)`);
    await queryRunner.query(`ALTER TABLE products ADD CONSTRAINT chk_products_stock CHECK (stock >= 0)`);
    await queryRunner.query(`ALTER TABLE products ADD CONSTRAINT chk_products_compare_price CHECK (compare_at_price IS NULL OR compare_at_price > price)`);
    await queryRunner.query(`ALTER TABLE products ADD CONSTRAINT chk_products_images CHECK (images IS NULL OR jsonb_typeof(images) = 'array')`);
    await queryRunner.query(`ALTER TABLE products ADD CONSTRAINT chk_products_avg_rating CHECK (average_rating >= 0 AND average_rating <= 5)`);
    await queryRunner.query(`ALTER TABLE products ADD CONSTRAINT chk_products_total_reviews CHECK (total_reviews >= 0)`);

    // order_items
    await queryRunner.query(`ALTER TABLE order_items ADD CONSTRAINT chk_order_items_quantity CHECK (quantity > 0)`);
    await queryRunner.query(`ALTER TABLE order_items ADD CONSTRAINT chk_order_items_unit_price CHECK (unit_price > 0)`);

    // cart_items
    await queryRunner.query(`ALTER TABLE cart_items ADD CONSTRAINT chk_cart_items_quantity CHECK (quantity >= 1)`);

    // coupons
    await queryRunner.query(`ALTER TABLE coupons ADD CONSTRAINT chk_coupons_value CHECK (value > 0)`);
    await queryRunner.query(`ALTER TABLE coupons ADD CONSTRAINT chk_coupons_dates CHECK (start_date < end_date)`);
    await queryRunner.query(`ALTER TABLE coupons ADD CONSTRAINT chk_coupons_current_uses CHECK (current_uses >= 0)`);
    await queryRunner.query(`ALTER TABLE coupons ADD CONSTRAINT chk_coupons_min_purchase CHECK (min_purchase IS NULL OR min_purchase >= 0)`);
    await queryRunner.query(`ALTER TABLE coupons ADD CONSTRAINT chk_coupons_max_discount CHECK (max_discount IS NULL OR max_discount > 0)`);
    await queryRunner.query(`ALTER TABLE coupons ADD CONSTRAINT chk_coupons_max_uses CHECK (max_uses IS NULL OR max_uses > 0)`);
    await queryRunner.query(`ALTER TABLE coupons ADD CONSTRAINT chk_coupons_percentage CHECK (type != 'percentage' OR (value >= 1 AND value <= 100))`);

    // reviews
    await queryRunner.query(`ALTER TABLE reviews ADD CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5)`);

    // orders
    await queryRunner.query(`ALTER TABLE orders ADD CONSTRAINT chk_orders_totals CHECK (subtotal >= 0 AND total >= 0 AND discount >= 0)`);
    await queryRunner.query(`ALTER TABLE orders ADD CONSTRAINT chk_orders_shipping_cost CHECK (shipping_cost >= 0)`);
    await queryRunner.query(`
      ALTER TABLE orders ADD CONSTRAINT chk_orders_shipping_address CHECK (
        shipping_address_snapshot ? 'street' AND shipping_address_snapshot ? 'city'
        AND shipping_address_snapshot ? 'department' AND shipping_address_snapshot ? 'recipientName'
      )
    `);

    // payments
    await queryRunner.query(`ALTER TABLE payments ADD CONSTRAINT chk_payments_amount CHECK (amount > 0)`);

    // banners
    await queryRunner.query(`ALTER TABLE banners ADD CONSTRAINT chk_banners_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date < end_date)`);

    // ═══════════════════════════════════════════════════════════════
    // FK INDEXES
    // ═══════════════════════════════════════════════════════════════
    await queryRunner.query(`CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_order_items_order_id ON order_items(order_id)`);
    await queryRunner.query(`CREATE INDEX idx_order_events_order_id ON order_events(order_id)`);
    await queryRunner.query(`CREATE INDEX idx_products_category_id ON products(category_id)`);
    await queryRunner.query(`CREATE INDEX idx_orders_user_id ON orders(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_addresses_user_id ON addresses(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_payments_order_id ON payments(order_id)`);
    await queryRunner.query(`CREATE INDEX idx_reviews_product_id ON reviews(product_id) WHERE is_approved = true`);
    await queryRunner.query(`CREATE INDEX idx_reviews_user_id ON reviews(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_cart_items_product_id ON cart_items(product_id)`);
    await queryRunner.query(`CREATE INDEX idx_order_items_product_id ON order_items(product_id)`);
    await queryRunner.query(`CREATE INDEX idx_shipments_order_id ON shipments(order_id)`);
    await queryRunner.query(`CREATE INDEX idx_wishlist_items_product_id ON wishlist_items(product_id)`);
    await queryRunner.query(`CREATE INDEX idx_categories_parent_id ON categories(parent_id)`);
    await queryRunner.query(`CREATE INDEX idx_reviews_order_id ON reviews(order_id)`);
    await queryRunner.query(`CREATE INDEX idx_reviews_product_id_fk ON reviews(product_id)`);

    // ═══════════════════════════════════════════════════════════════
    // BUSINESS INDEXES
    // ═══════════════════════════════════════════════════════════════
    await queryRunner.query(`CREATE INDEX idx_orders_pending_created ON orders(created_at) WHERE status = 'pending'`);
    await queryRunner.query(`CREATE INDEX idx_orders_user_coupon ON orders(user_id, coupon_id) WHERE coupon_id IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX idx_products_active_category ON products(is_active, category_id, price)`);
    await queryRunner.query(`CREATE INDEX idx_banners_active ON banners(position, sort_order) WHERE is_active = true`);
    await queryRunner.query(`CREATE INDEX idx_refresh_tokens_active ON refresh_tokens(user_id) WHERE is_revoked = false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse dependency order
    await queryRunner.query(`DROP TABLE IF EXISTS order_number_counters CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS reviews CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS shipments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_events CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_items CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS orders CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS wishlist_items CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS cart_items CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS carts CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS addresses CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS banners CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS coupons CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS products CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);

    // Drop ENUM types
    await queryRunner.query(`DROP TYPE IF EXISTS shipment_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS carrier_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS coupon_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS banner_position_enum`);
  }
}
