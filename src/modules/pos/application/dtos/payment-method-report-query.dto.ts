import { IsDateString } from 'class-validator';

export class PaymentMethodReportQueryDto {
  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;
}
