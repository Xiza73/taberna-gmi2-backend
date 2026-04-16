export class OrdersByStatusDto {
  pending: number;
  paid: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;

  constructor(data: Record<string, number>) {
    this.pending = data['pending'] ?? 0;
    this.paid = data['paid'] ?? 0;
    this.processing = data['processing'] ?? 0;
    this.shipped = data['shipped'] ?? 0;
    this.delivered = data['delivered'] ?? 0;
    this.cancelled = data['cancelled'] ?? 0;
    this.refunded = data['refunded'] ?? 0;
  }
}

export class RecentOrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;

  constructor(data: { id: string; orderNumber: string; customerName: string; total: number; status: string; createdAt: Date }) {
    this.id = data.id;
    this.orderNumber = data.orderNumber;
    this.customerName = data.customerName;
    this.total = data.total;
    this.status = data.status;
    this.createdAt = data.createdAt.toISOString();
  }
}

export class DashboardResponseDto {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  ordersToday: number;
  revenueToday: number;
  ordersByStatus: OrdersByStatusDto;
  recentOrders: RecentOrderDto[];

  constructor(data: {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    ordersToday: number;
    revenueToday: number;
    ordersByStatus: Record<string, number>;
    recentOrders: Array<{ id: string; orderNumber: string; customerName: string; total: number; status: string; createdAt: Date }>;
  }) {
    this.totalOrders = data.totalOrders;
    this.totalRevenue = data.totalRevenue;
    this.totalCustomers = data.totalCustomers;
    this.totalProducts = data.totalProducts;
    this.ordersToday = data.ordersToday;
    this.revenueToday = data.revenueToday;
    this.ordersByStatus = new OrdersByStatusDto(data.ordersByStatus);
    this.recentOrders = data.recentOrders.map((o) => new RecentOrderDto(o));
  }
}
