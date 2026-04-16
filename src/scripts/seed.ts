import { DataSource } from 'typeorm';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ecommerce_gmi2',
  synchronize: false,
});

function uuid(): string {
  return randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

async function seed() {
  await dataSource.initialize();
  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    console.log('Seeding database...\n');

    // ──────────────────────────────────────
    // Users
    // ──────────────────────────────────────
    const passwordHash = await hash('Password123!', 12);

    const userJuan = uuid();
    const userMaria = uuid();
    const userCarlos = uuid();
    const userLucia = uuid();

    const users = [
      [userJuan, 'Juan Pérez', 'juan@example.com', passwordHash, 'customer', true],
      [userMaria, 'María García', 'maria@example.com', passwordHash, 'customer', true],
      [userCarlos, 'Carlos López', 'carlos@example.com', passwordHash, 'customer', true],
      [userLucia, 'Lucía Torres', 'lucia@example.com', passwordHash, 'customer', false],
    ];

    for (const u of users) {
      await qr.query(
        `INSERT INTO users (id, name, email, password, role, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6, NOW(), NOW()) ON CONFLICT (email) DO NOTHING`,
        u,
      );
    }
    console.log(`  ✓ 4 customers created`);

    // ──────────────────────────────────────
    // Categories
    // ──────────────────────────────────────
    const catElectronics = uuid();
    const catClothing = uuid();
    const catHome = uuid();
    const catSports = uuid();
    const catPhones = uuid();
    const catLaptops = uuid();
    const catMen = uuid();
    const catWomen = uuid();

    const categories = [
      [catElectronics, 'Electrónica', 'electronica', 'Dispositivos y gadgets electrónicos', null, true, 0],
      [catClothing, 'Ropa', 'ropa', 'Moda y vestimenta', null, true, 1],
      [catHome, 'Hogar', 'hogar', 'Artículos para el hogar y decoración', null, true, 2],
      [catSports, 'Deportes', 'deportes', 'Artículos deportivos y fitness', null, true, 3],
      [catPhones, 'Celulares', 'celulares', 'Smartphones y accesorios', catElectronics, true, 0],
      [catLaptops, 'Laptops', 'laptops', 'Computadoras portátiles', catElectronics, true, 1],
      [catMen, 'Hombre', 'ropa-hombre', 'Ropa para hombre', catClothing, true, 0],
      [catWomen, 'Mujer', 'ropa-mujer', 'Ropa para mujer', catClothing, true, 1],
    ];

    for (const c of categories) {
      await qr.query(
        `INSERT INTO categories (id, name, slug, description, parent_id, is_active, sort_order, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, NOW(), NOW()) ON CONFLICT (slug) DO NOTHING`,
        c,
      );
    }
    console.log(`  ✓ 8 categories created`);

    // ──────────────────────────────────────
    // Products
    // ──────────────────────────────────────
    const prod1 = uuid();
    const prod2 = uuid();
    const prod3 = uuid();
    const prod4 = uuid();
    const prod5 = uuid();
    const prod6 = uuid();
    const prod7 = uuid();
    const prod8 = uuid();
    const prod9 = uuid();
    const prod10 = uuid();

    const products = [
      [prod1, 'iPhone 15 Pro', 'iphone-15-pro', 'Apple iPhone 15 Pro 256GB', 459900, 499900, 'IPH-15PRO', 25, '["https://placehold.co/600x600?text=iPhone+15+Pro"]', catPhones, true],
      [prod2, 'Samsung Galaxy S24', 'samsung-galaxy-s24', 'Samsung Galaxy S24 128GB', 349900, 389900, 'SAM-S24', 40, '["https://placehold.co/600x600?text=Galaxy+S24"]', catPhones, true],
      [prod3, 'MacBook Air M3', 'macbook-air-m3', 'Apple MacBook Air M3 15" 16GB RAM', 629900, null, 'MBA-M3-15', 15, '["https://placehold.co/600x600?text=MacBook+Air"]', catLaptops, true],
      [prod4, 'Lenovo ThinkPad X1', 'lenovo-thinkpad-x1', 'Lenovo ThinkPad X1 Carbon Gen 11', 539900, 579900, 'LEN-X1C11', 10, '["https://placehold.co/600x600?text=ThinkPad+X1"]', catLaptops, true],
      [prod5, 'Polo Ralph Lauren', 'polo-ralph-lauren', 'Polo clásico slim fit algodón piqué', 34900, 44900, 'PRL-POLO-M', 60, '["https://placehold.co/600x600?text=Polo+RL"]', catMen, true],
      [prod6, 'Vestido Floral Zara', 'vestido-floral-zara', 'Vestido midi estampado floral', 24900, null, 'ZAR-VF-001', 35, '["https://placehold.co/600x600?text=Vestido+Floral"]', catWomen, true],
      [prod7, 'Set Sábanas 600 Hilos', 'set-sabanas-600-hilos', 'Juego de sábanas 100% algodón egipcio', 18900, 24900, 'SAB-600-Q', 50, '["https://placehold.co/600x600?text=Sábanas+600"]', catHome, true],
      [prod8, 'Lámpara LED Moderna', 'lampara-led-moderna', 'Lámpara de pie LED regulable 3 temperaturas', 12900, null, 'LAMP-LED-01', 80, '["https://placehold.co/600x600?text=Lámpara+LED"]', catHome, true],
      [prod9, 'Zapatillas Nike Air Max', 'zapatillas-nike-air-max', 'Nike Air Max 90 Essential', 54900, 64900, 'NIK-AM90', 30, '["https://placehold.co/600x600?text=Nike+Air+Max"]', catSports, true],
      [prod10, 'Mancuernas Ajustables', 'mancuernas-ajustables', 'Set mancuernas ajustables 5-25kg', 29900, null, 'MAN-ADJ-25', 20, '["https://placehold.co/600x600?text=Mancuernas"]', catSports, true],
    ];

    for (const p of products) {
      await qr.query(
        `INSERT INTO products (id, name, slug, description, price, compare_at_price, sku, stock, images, category_id, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11, NOW(), NOW()) ON CONFLICT (slug) DO NOTHING`,
        p,
      );
    }
    console.log(`  ✓ 10 products created`);

    // ──────────────────────────────────────
    // Banners
    // ──────────────────────────────────────
    const banners = [
      [uuid(), 'Ofertas de Temporada', 'https://placehold.co/1200x400?text=Ofertas+Temporada', '/productos?sort=price', 'hero', true, 0, daysAgo(5), daysFromNow(30)],
      [uuid(), 'Nuevos Celulares', 'https://placehold.co/1200x400?text=Nuevos+Celulares', '/categorias/celulares', 'hero', true, 1, daysAgo(2), daysFromNow(60)],
      [uuid(), 'Envío Gratis +S/199', 'https://placehold.co/600x200?text=Envío+Gratis', null, 'secondary', true, 0, null, null],
      [uuid(), 'Métodos de Pago', 'https://placehold.co/600x100?text=Métodos+de+Pago', null, 'footer', true, 0, null, null],
    ];

    for (const b of banners) {
      await qr.query(
        `INSERT INTO banners (id, title, image_url, link_url, position, is_active, sort_order, start_date, end_date, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW(), NOW())`,
        b,
      );
    }
    console.log(`  ✓ 4 banners created`);

    // ──────────────────────────────────────
    // Coupons
    // ──────────────────────────────────────
    const coupon1 = uuid();
    const coupon2 = uuid();
    const coupon3 = uuid();

    const coupons = [
      [coupon1, 'BIENVENIDO10', 'percentage', 10, null, 5000, 100, 1, 0, true, daysAgo(10), daysFromNow(90)],
      [coupon2, 'DESCUENTO50', 'fixed_amount', 5000, 15000, null, 50, 2, 0, true, daysAgo(5), daysFromNow(60)],
      [coupon3, 'VERANO2026', 'percentage', 15, 20000, 10000, 200, 1, 0, true, daysAgo(1), daysFromNow(45)],
    ];

    for (const c of coupons) {
      await qr.query(
        `INSERT INTO coupons (id, code, type, value, min_purchase, max_discount, max_uses, max_uses_per_user, current_uses, is_active, start_date, end_date, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`,
        c,
      );
    }
    console.log(`  ✓ 3 coupons created`);

    // ──────────────────────────────────────
    // Addresses
    // ──────────────────────────────────────
    const addr1 = uuid();
    const addr2 = uuid();

    const addresses = [
      [addr1, userJuan, 'Casa', 'Juan Pérez', '987654321', 'Av. Javier Prado 1234', 'San Isidro', 'Lima', 'Lima', '15036', 'Frente al parque', true],
      [uuid(), userJuan, 'Oficina', 'Juan Pérez', '987654321', 'Calle Las Begonias 456', 'San Isidro', 'Lima', 'Lima', '15036', 'Piso 12', false],
      [addr2, userMaria, 'Mi casa', 'María García', '912345678', 'Jr. de la Unión 789', 'Cercado de Lima', 'Lima', 'Lima', '15001', null, true],
      [uuid(), userCarlos, 'Departamento', 'Carlos López', '956781234', 'Av. Larco 321', 'Miraflores', 'Lima', 'Lima', '15074', 'Dpto 502', true],
    ];

    for (const a of addresses) {
      await qr.query(
        `INSERT INTO addresses (id, user_id, label, recipient_name, phone, street, district, city, department, zip_code, reference, is_default, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW(), NOW())`,
        a,
      );
    }
    console.log(`  ✓ 4 addresses created`);

    // ──────────────────────────────────────
    // Orders (with items, events, payments)
    // ──────────────────────────────────────

    // Order 1: Juan — delivered (iPhone + Polo)
    const order1 = uuid();
    const orderNum1 = 'ORD-20260410-001';
    await qr.query(
      `INSERT INTO orders (id, order_number, user_id, status, subtotal, discount, shipping_cost, total, coupon_id, coupon_code, coupon_discount, shipping_address_snapshot, customer_name, customer_email, customer_phone, created_at, updated_at)
       VALUES ($1,$2,$3,'delivered', 494800, 0, 1500, 496300, NULL, NULL, NULL, $4, $5, $6, $7, $8, $9)`,
      [order1, orderNum1, userJuan, JSON.stringify({ street: 'Av. Javier Prado 1234', city: 'Lima', department: 'Lima', recipientName: 'Juan Pérez' }), 'Juan Pérez', 'juan@example.com', '987654321', daysAgo(15), daysAgo(10)],
    );

    const oi1a = uuid();
    const oi1b = uuid();
    await qr.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, product_slug, product_image, unit_price, quantity, subtotal, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, $10, $10)`,
      [oi1a, order1, prod1, 'iPhone 15 Pro', 'iphone-15-pro', 'https://placehold.co/600x600?text=iPhone+15+Pro', 459900, 1, 459900, daysAgo(15)],
    );
    await qr.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, product_slug, product_image, unit_price, quantity, subtotal, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, $10, $10)`,
      [oi1b, order1, prod5, 'Polo Ralph Lauren', 'polo-ralph-lauren', 'https://placehold.co/600x600?text=Polo+RL', 34900, 1, 34900, daysAgo(15)],
    );

    // Order 1 events
    for (const [status, desc, ago] of [
      ['pending', 'Pedido creado', 15],
      ['paid', 'Pago confirmado vía MercadoPago', 15],
      ['processing', 'Pedido en preparación', 14],
      ['shipped', 'Pedido despachado', 12],
      ['delivered', 'Pedido entregado', 10],
    ] as [string, string, number][]) {
      await qr.query(
        `INSERT INTO order_events (id, order_id, status, description, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$5)`,
        [uuid(), order1, status, desc, daysAgo(ago)],
      );
    }

    // Order 1 payment
    await qr.query(
      `INSERT INTO payments (id, order_id, external_id, preference_id, method, status, amount, paid_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,'approved',$6,$7,$8,$8)`,
      [uuid(), order1, 'MP-PAY-100001', 'MP-PREF-100001', 'credit_card', 496300, daysAgo(15), daysAgo(15)],
    );

    // Order 1 shipment
    await qr.query(
      `INSERT INTO shipments (id, order_id, carrier, tracking_number, tracking_url, status, shipped_at, delivered_at, created_at, updated_at)
       VALUES ($1,$2,'olva',$3,$4,'delivered',$5,$6,$7,$7)`,
      [uuid(), order1, 'OLV-2026-98765', 'https://tracking.olva.com.pe/OLV-2026-98765', daysAgo(12), daysAgo(10), daysAgo(12)],
    );

    // Order 2: María — paid (MacBook)
    const order2 = uuid();
    const orderNum2 = 'ORD-20260412-001';
    await qr.query(
      `INSERT INTO orders (id, order_number, user_id, status, subtotal, discount, shipping_cost, total, coupon_id, coupon_code, coupon_discount, shipping_address_snapshot, customer_name, customer_email, created_at, updated_at)
       VALUES ($1,$2,$3,'paid', 629900, 5000, 0, 624900, $4, 'DESCUENTO50', 5000, $5, $6, $7, $8, $8)`,
      [order2, orderNum2, userMaria, coupon2, JSON.stringify({ street: 'Jr. de la Unión 789', city: 'Lima', department: 'Lima', recipientName: 'María García' }), 'María García', 'maria@example.com', daysAgo(4)],
    );

    await qr.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, product_slug, product_image, unit_price, quantity, subtotal, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
      [uuid(), order2, prod3, 'MacBook Air M3', 'macbook-air-m3', 'https://placehold.co/600x600?text=MacBook+Air', 629900, 1, 629900, daysAgo(4)],
    );

    for (const [status, desc, ago] of [
      ['pending', 'Pedido creado', 4],
      ['paid', 'Pago confirmado vía MercadoPago', 4],
    ] as [string, string, number][]) {
      await qr.query(
        `INSERT INTO order_events (id, order_id, status, description, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$5)`,
        [uuid(), order2, status, desc, daysAgo(ago)],
      );
    }

    await qr.query(
      `INSERT INTO payments (id, order_id, external_id, preference_id, method, status, amount, paid_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,'approved',$6,$7,$8,$8)`,
      [uuid(), order2, 'MP-PAY-100002', 'MP-PREF-100002', 'debit_card', 624900, daysAgo(4), daysAgo(4)],
    );

    // Increment coupon usage
    await qr.query(`UPDATE coupons SET current_uses = current_uses + 1 WHERE id = $1`, [coupon2]);

    // Order 3: Carlos — pending (Nike + Mancuernas)
    const order3 = uuid();
    const orderNum3 = 'ORD-20260416-001';
    await qr.query(
      `INSERT INTO orders (id, order_number, user_id, status, subtotal, discount, shipping_cost, total, shipping_address_snapshot, customer_name, customer_email, customer_phone, created_at, updated_at)
       VALUES ($1,$2,$3,'pending', 84800, 0, 1500, 86300, $4, $5, $6, $7, $8, $8)`,
      [order3, orderNum3, userCarlos, JSON.stringify({ street: 'Av. Larco 321', city: 'Lima', department: 'Lima', recipientName: 'Carlos López' }), 'Carlos López', 'carlos@example.com', '956781234', daysAgo(0)],
    );

    await qr.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, product_slug, product_image, unit_price, quantity, subtotal, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
      [uuid(), order3, prod9, 'Zapatillas Nike Air Max', 'zapatillas-nike-air-max', 'https://placehold.co/600x600?text=Nike+Air+Max', 54900, 1, 54900, daysAgo(0)],
    );
    await qr.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, product_slug, product_image, unit_price, quantity, subtotal, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
      [uuid(), order3, prod10, 'Mancuernas Ajustables', 'mancuernas-ajustables', 'https://placehold.co/600x600?text=Mancuernas', 29900, 1, 29900, daysAgo(0)],
    );

    await qr.query(
      `INSERT INTO order_events (id, order_id, status, description, created_at, updated_at)
       VALUES ($1,$2,'pending','Pedido creado',$3,$3)`,
      [uuid(), order3, daysAgo(0)],
    );

    // Payment pending for order 3
    await qr.query(
      `INSERT INTO payments (id, order_id, preference_id, status, amount, created_at, updated_at)
       VALUES ($1,$2,$3,'pending',$4,$5,$5)`,
      [uuid(), order3, 'MP-PREF-100003', 86300, daysAgo(0)],
    );

    console.log(`  ✓ 3 orders created (delivered, paid, pending)`);

    // ──────────────────────────────────────
    // Order number counter
    // ──────────────────────────────────────
    await qr.query(
      `INSERT INTO order_number_counters (date, last_number) VALUES (CURRENT_DATE, 1) ON CONFLICT (date) DO UPDATE SET last_number = GREATEST(order_number_counters.last_number, 1)`,
    );
    console.log(`  ✓ Order number counter initialized`);

    // ──────────────────────────────────────
    // Reviews (on delivered order products)
    // ──────────────────────────────────────
    const review1 = uuid();
    const review2 = uuid();

    await qr.query(
      `INSERT INTO reviews (id, user_id, product_id, order_id, rating, comment, is_approved, created_at, updated_at)
       VALUES ($1,$2,$3,$4, 5, 'Excelente celular, muy rápido y la cámara es increíble. Totalmente recomendado.', true, $5, $5)
       ON CONFLICT ON CONSTRAINT uq_reviews_user_product DO NOTHING`,
      [review1, userJuan, prod1, order1, daysAgo(8)],
    );
    await qr.query(
      `INSERT INTO reviews (id, user_id, product_id, order_id, rating, comment, is_approved, created_at, updated_at)
       VALUES ($1,$2,$3,$4, 4, 'Buena calidad de tela. Talla un poco grande, pedir una menos.', false, $5, $5)
       ON CONFLICT ON CONSTRAINT uq_reviews_user_product DO NOTHING`,
      [review2, userJuan, prod5, order1, daysAgo(7)],
    );

    // Update product ratings for the approved review
    await qr.query(
      `UPDATE products SET average_rating = 5.00, total_reviews = 1 WHERE id = $1`,
      [prod1],
    );
    console.log(`  ✓ 2 reviews created (1 approved, 1 pending)`);

    // ──────────────────────────────────────
    // Cart (María has items in cart)
    // ──────────────────────────────────────
    const cartMaria = uuid();
    await qr.query(
      `INSERT INTO carts (id, user_id, created_at, updated_at) VALUES ($1,$2, NOW(), NOW()) ON CONFLICT DO NOTHING`,
      [cartMaria, userMaria],
    );
    await qr.query(
      `INSERT INTO cart_items (id, cart_id, product_id, quantity, created_at, updated_at) VALUES ($1,$2,$3, 2, NOW(), NOW())`,
      [uuid(), cartMaria, prod7],
    );
    await qr.query(
      `INSERT INTO cart_items (id, cart_id, product_id, quantity, created_at, updated_at) VALUES ($1,$2,$3, 1, NOW(), NOW())`,
      [uuid(), cartMaria, prod9],
    );
    console.log(`  ✓ Cart with 2 items created (María)`);

    // ──────────────────────────────────────
    // Wishlist
    // ──────────────────────────────────────
    await qr.query(
      `INSERT INTO wishlist_items (id, user_id, product_id, created_at, updated_at) VALUES ($1,$2,$3, NOW(), NOW())
       ON CONFLICT ON CONSTRAINT uq_wishlist_user_product DO NOTHING`,
      [uuid(), userJuan, prod3],
    );
    await qr.query(
      `INSERT INTO wishlist_items (id, user_id, product_id, created_at, updated_at) VALUES ($1,$2,$3, NOW(), NOW())
       ON CONFLICT ON CONSTRAINT uq_wishlist_user_product DO NOTHING`,
      [uuid(), userMaria, prod6],
    );
    await qr.query(
      `INSERT INTO wishlist_items (id, user_id, product_id, created_at, updated_at) VALUES ($1,$2,$3, NOW(), NOW())
       ON CONFLICT ON CONSTRAINT uq_wishlist_user_product DO NOTHING`,
      [uuid(), userCarlos, prod1],
    );
    console.log(`  ✓ 3 wishlist items created`);

    // ──────────────────────────────────────
    await qr.commitTransaction();
    console.log('\n✓ Seed completed successfully!\n');

    console.log('Test accounts (password: Password123!):');
    console.log('  - juan@example.com   (customer)');
    console.log('  - maria@example.com  (customer)');
    console.log('  - carlos@example.com (customer)');
    console.log('  - lucia@example.com  (customer, suspended)');
    console.log('  - admin@tienda.com   (admin, from migration)');
  } catch (error) {
    await qr.rollbackTransaction();
    console.error('\n✗ Seed failed:', (error as Error).message);
    process.exit(1);
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

seed();
