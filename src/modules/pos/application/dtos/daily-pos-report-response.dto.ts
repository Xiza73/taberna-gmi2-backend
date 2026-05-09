interface DailyPosReportSummary {
  totalOrders: number;
  totalSales: number;
  byPaymentMethod: Array<{
    paymentMethod: string;
    count: number;
    total: number;
  }>;
  byStatus: Array<{ status: string; count: number }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    total: number;
  }>;
}

export class DailyPosReportResponseDto {
  readonly date: string;
  readonly totalOrders: number;
  readonly totalSales: number;
  readonly byPaymentMethod: Array<{
    paymentMethod: string;
    count: number;
    total: number;
  }>;
  readonly byStatus: Array<{ status: string; count: number }>;
  readonly topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    total: number;
  }>;

  constructor(date: string, summary: DailyPosReportSummary) {
    this.date = date;
    this.totalOrders = summary.totalOrders;
    this.totalSales = summary.totalSales;
    this.byPaymentMethod = summary.byPaymentMethod;
    this.byStatus = summary.byStatus;
    this.topProducts = summary.topProducts;
  }
}
