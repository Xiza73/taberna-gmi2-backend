interface StaffSalesReportArgs {
  dateFrom: string;
  dateTo: string;
  items: Array<{
    staffId: string;
    staffName: string;
    count: number;
    totalAmount: number;
  }>;
}

export class StaffSalesReportResponseDto {
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly items: Array<{
    staffId: string;
    staffName: string;
    count: number;
    totalAmount: number;
  }>;

  constructor(args: StaffSalesReportArgs) {
    this.dateFrom = args.dateFrom;
    this.dateTo = args.dateTo;
    this.items = args.items;
  }
}
