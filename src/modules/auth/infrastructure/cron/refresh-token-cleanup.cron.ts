import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../domain/interfaces/refresh-token-repository.interface.js';

@Injectable()
export class RefreshTokenCleanupCron {
  private readonly logger = new Logger(RefreshTokenCleanupCron.name);

  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  @Cron('0 0 3 * * 0')
  async handleCleanup(): Promise<void> {
    const deleted = await this.refreshTokenRepository.deleteExpiredAndRevoked();
    this.logger.log(`Cleaned up ${deleted} expired/revoked refresh tokens`);
  }
}
