import { Global, Module } from '@nestjs/common';

import { EMAIL_SENDER } from './domain/interfaces/email-sender.interface.js';
import { NodemailerEmailSender } from './infrastructure/services/nodemailer-email-sender.js';

@Global()
@Module({
  providers: [
    { provide: EMAIL_SENDER, useClass: NodemailerEmailSender },
  ],
  exports: [EMAIL_SENDER],
})
export class NotificationsModule {}
