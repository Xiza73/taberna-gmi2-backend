import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { ExpireUnpaidOrdersUseCase } from '../../application/use-cases/expire-unpaid-orders.use-case';

@Injectable()
export class OrderExpirationCron {
  private readonly logger = new Logger(OrderExpirationCron.name);

  constructor(
    private readonly expireUnpaidOrdersUseCase: ExpireUnpaidOrdersUseCase,
  ) {}

  @Cron('0 */15 * * * *')
  async handleExpiration(): Promise<void> {
    try {
      const expired = await this.expireUnpaidOrdersUseCase.execute();
      if (expired > 0) {
        this.logger.log(`Expired ${expired} unpaid orders`);
      }
    } catch (error) {
      this.logger.error('Order expiration cron failed', error);
    }
  }
}
