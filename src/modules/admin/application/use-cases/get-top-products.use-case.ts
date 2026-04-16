import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { TopProductDto } from '../dtos/sales-report-response.dto.js';

@Injectable()
export class GetTopProductsUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(limit: number = 10): Promise<TopProductDto[]> {
    const rows = await this.dataSource.query<
      Array<{
        product_id: string;
        product_name: string;
        total_sold: string;
        total_revenue: string;
      }>
    >(
      `SELECT oi.product_id, oi.product_name,
              SUM(oi.quantity)::int AS total_sold,
              SUM(oi.subtotal)::int AS total_revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
       GROUP BY oi.product_id, oi.product_name
       ORDER BY total_sold DESC
       LIMIT $1`,
      [limit],
    );

    return rows.map(
      (r) =>
        new TopProductDto({
          productId: r.product_id,
          productName: r.product_name,
          totalSold: r.total_sold as unknown as number,
          totalRevenue: r.total_revenue as unknown as number,
        }),
    );
  }
}
