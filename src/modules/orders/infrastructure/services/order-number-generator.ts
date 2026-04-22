import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { type IOrderNumberGenerator } from '../../domain/interfaces/order-number-generator.interface';

@Injectable()
export class OrderNumberGenerator implements IOrderNumberGenerator {
  constructor(private readonly dataSource: DataSource) {}

  async generate(): Promise<string> {
    const result = await this.dataSource.query<Array<{ last_number: number }>>(
      `INSERT INTO order_number_counters (date, last_number)
       VALUES (CURRENT_DATE, 1)
       ON CONFLICT (date) DO UPDATE SET last_number = order_number_counters.last_number + 1
       RETURNING last_number`,
    );

    const lastNumber = result[0].last_number;
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const paddedNumber = String(lastNumber).padStart(3, '0');

    return `ORD-${dateStr}-${paddedNumber}`;
  }
}
