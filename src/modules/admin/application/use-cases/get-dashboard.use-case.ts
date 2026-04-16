import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { DashboardResponseDto } from '../dtos/dashboard-response.dto.js';

@Injectable()
export class GetDashboardUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(): Promise<DashboardResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      ordersToday,
      revenueToday,
      ordersByStatus,
      recentOrders,
    ] = await Promise.all([
      this.countOrders(),
      this.sumRevenue(),
      this.countCustomers(),
      this.countProducts(),
      this.countOrdersSince(today),
      this.sumRevenueSince(today),
      this.getOrdersByStatus(),
      this.getRecentOrders(),
    ]);

    return new DashboardResponseDto({
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      ordersToday,
      revenueToday,
      ordersByStatus,
      recentOrders,
    });
  }

  private async countOrders(): Promise<number> {
    const result = await this.dataSource.query<[{ count: string }]>(
      `SELECT COUNT(*)::int AS count FROM orders WHERE status NOT IN ('cancelled')`,
    );
    return result[0].count as unknown as number;
  }

  private async sumRevenue(): Promise<number> {
    const result = await this.dataSource.query<[{ sum: string | null }]>(
      `SELECT COALESCE(SUM(total), 0)::int AS sum FROM orders WHERE status IN ('paid', 'processing', 'shipped', 'delivered')`,
    );
    return result[0].sum as unknown as number;
  }

  private async countCustomers(): Promise<number> {
    const result = await this.dataSource.query<[{ count: string }]>(
      `SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer'`,
    );
    return result[0].count as unknown as number;
  }

  private async countProducts(): Promise<number> {
    const result = await this.dataSource.query<[{ count: string }]>(
      `SELECT COUNT(*)::int AS count FROM products WHERE is_active = true`,
    );
    return result[0].count as unknown as number;
  }

  private async countOrdersSince(since: Date): Promise<number> {
    const result = await this.dataSource.query<[{ count: string }]>(
      `SELECT COUNT(*)::int AS count FROM orders WHERE created_at >= $1 AND status NOT IN ('cancelled')`,
      [since],
    );
    return result[0].count as unknown as number;
  }

  private async sumRevenueSince(since: Date): Promise<number> {
    const result = await this.dataSource.query<[{ sum: string | null }]>(
      `SELECT COALESCE(SUM(total), 0)::int AS sum FROM orders WHERE created_at >= $1 AND status IN ('paid', 'processing', 'shipped', 'delivered')`,
      [since],
    );
    return result[0].sum as unknown as number;
  }

  private async getOrdersByStatus(): Promise<Record<string, number>> {
    const rows = await this.dataSource.query<Array<{ status: string; count: string }>>(
      `SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`,
    );
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.status] = row.count as unknown as number;
    }
    return result;
  }

  private async getRecentOrders(): Promise<Array<{ id: string; orderNumber: string; customerName: string; total: number; status: string; createdAt: Date }>> {
    const rows = await this.dataSource.query<Array<{ id: string; order_number: string; customer_name: string; total: number; status: string; created_at: Date }>>(
      `SELECT id, order_number, customer_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10`,
    );
    return rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      customerName: r.customer_name,
      total: r.total,
      status: r.status,
      createdAt: r.created_at,
    }));
  }
}
