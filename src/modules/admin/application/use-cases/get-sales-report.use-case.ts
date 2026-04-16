import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { type SalesReportQueryDto } from '../dtos/sales-report-query.dto.js';
import { SalesReportResponseDto } from '../dtos/sales-report-response.dto.js';

@Injectable()
export class GetSalesReportUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(dto: SalesReportQueryDto): Promise<SalesReportResponseDto> {
    const rows = await this.dataSource.query<Array<{ date: string; orders: string; revenue: string }>>(
      `SELECT DATE(created_at) AS date, COUNT(*)::int AS orders, COALESCE(SUM(total), 0)::int AS revenue
       FROM orders
       WHERE created_at >= $1 AND created_at < ($2::date + INTERVAL '1 day')
         AND status IN ('paid', 'processing', 'shipped', 'delivered')
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [dto.dateFrom, dto.dateTo],
    );

    const items = rows.map((r) => ({
      date: r.date,
      orders: r.orders as unknown as number,
      revenue: r.revenue as unknown as number,
    }));

    const totalOrders = items.reduce((sum, i) => sum + i.orders, 0);
    const totalRevenue = items.reduce((sum, i) => sum + i.revenue, 0);

    return new SalesReportResponseDto({
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
      totalOrders,
      totalRevenue,
      items,
    });
  }
}
