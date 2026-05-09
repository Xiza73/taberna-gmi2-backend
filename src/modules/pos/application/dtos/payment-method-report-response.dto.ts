interface PaymentMethodReportArgs {
  dateFrom: string;
  dateTo: string;
  items: Array<{
    paymentMethod: string;
    count: number;
    totalAmount: number;
  }>;
}

export class PaymentMethodReportResponseDto {
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly items: Array<{
    paymentMethod: string;
    count: number;
    totalAmount: number;
  }>;

  constructor(args: PaymentMethodReportArgs) {
    this.dateFrom = args.dateFrom;
    this.dateTo = args.dateTo;
    this.items = args.items;
  }
}
