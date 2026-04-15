# 14. Admin (Orchestration)

Dashboard y reportes del backoffice. No tiene entidades propias.

**Endpoints:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/dashboard` | admin | Resumen general |
| GET | `/admin/dashboard/sales` | admin | Ventas por periodo |
| GET | `/admin/dashboard/top-products` | admin | Productos mas vendidos |

**Dashboard Response:**
```
{
  totalOrders, totalRevenue, totalCustomers, totalProducts,
  ordersToday, revenueToday,
  ordersByStatus: { pending: N, paid: N, shipped: N, ... },
  recentOrders: [...]
}
```

**Use Cases**: `GetDashboardUseCase`, `GetSalesReportUseCase`, `GetTopProductsUseCase`
