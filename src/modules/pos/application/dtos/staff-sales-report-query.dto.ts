import { IsDateString } from 'class-validator';

export class StaffSalesReportQueryDto {
  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;
}
