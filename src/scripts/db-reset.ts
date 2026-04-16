import { DataSource } from 'typeorm';
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

async function reset() {
  await dataSource.initialize();
  const qr = dataSource.createQueryRunner();
  await qr.connect();

  try {
    console.log('Resetting database...\n');

    // Drop all tables in correct order (respects FK constraints)
    const tables = [
      'order_events',
      'payments',
      'shipments',
      'order_items',
      'orders',
      'reviews',
      'cart_items',
      'carts',
      'wishlist_items',
      'addresses',
      'refresh_tokens',
      'products',
      'categories',
      'banners',
      'coupons',
      'order_number_counters',
      'users',
      'migrations',
    ];

    for (const table of tables) {
      await qr.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      console.log(`  ✗ Dropped ${table}`);
    }

    // Drop custom ENUM types
    const enums = [
      'orders_status_enum',
      'payments_status_enum',
      'shipments_status_enum',
      'shipments_carrier_enum',
      'banners_position_enum',
      'coupons_type_enum',
    ];

    for (const e of enums) {
      await qr.query(`DROP TYPE IF EXISTS "${e}" CASCADE`);
    }
    console.log(`  ✗ Dropped ${enums.length} enum types`);

    console.log('\n✓ Database reset complete.');
    console.log('  Run "npm run migration:run" to recreate schema.');
    console.log('  Run "npm run db:seed" to populate with sample data.\n');
  } catch (error) {
    console.error('\n✗ Reset failed:', (error as Error).message);
    process.exit(1);
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

void reset();
