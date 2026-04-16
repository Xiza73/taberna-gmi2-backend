export class SalesReportItemDto {
  date: string;
  orders: number;
  revenue: number;

  constructor(data: { date: string; orders: number; revenue: number }) {
    this.date = data.date;
    this.orders = data.orders;
    this.revenue = data.revenue;
  }
}

export class SalesReportResponseDto {
  dateFrom: string;
  dateTo: string;
  totalOrders: number;
  totalRevenue: number;
  items: SalesReportItemDto[];

  constructor(data: {
    dateFrom: string;
    dateTo: string;
    totalOrders: number;
    totalRevenue: number;
    items: Array<{ date: string; orders: number; revenue: number }>;
  }) {
    this.dateFrom = data.dateFrom;
    this.dateTo = data.dateTo;
    this.totalOrders = data.totalOrders;
    this.totalRevenue = data.totalRevenue;
    this.items = data.items.map((i) => new SalesReportItemDto(i));
  }
}

export class TopProductDto {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;

  constructor(data: { productId: string; productName: string; totalSold: number; totalRevenue: number }) {
    this.productId = data.productId;
    this.productName = data.productName;
    this.totalSold = data.totalSold;
    this.totalRevenue = data.totalRevenue;
  }
}
