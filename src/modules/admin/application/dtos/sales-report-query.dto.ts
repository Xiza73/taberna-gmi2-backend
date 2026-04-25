import { IsDateString } from 'class-validator';

export class SalesReportQueryDto {
  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;
}
