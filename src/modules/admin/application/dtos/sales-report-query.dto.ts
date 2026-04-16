import { IsDateString, IsOptional } from 'class-validator';

export class SalesReportQueryDto {
  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;

  @IsOptional()
  @IsDateString()
  groupBy?: string;
}
