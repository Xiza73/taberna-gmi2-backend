# 14. Admin (Orchestration)

Dashboard y reportes del backoffice. No tiene entidades propias.

**Acceso por rol:**
- Dashboard general: Todos los staff (`@RequireSubjectType(STAFF)`)
- Sales report y top products: Admin y SuperAdmin (`@RequireStaffRole(SUPER_ADMIN, ADMIN)`)

**Endpoints:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/admin/dashboard` | JWT+Staff | Resumen general |
| GET | `/admin/dashboard/sales` | JWT+Admin/SuperAdmin | Ventas por periodo |
| GET | `/admin/dashboard/top-products` | JWT+Admin/SuperAdmin | Productos mas vendidos |

**Dashboard Response:**
```
{
  totalOrders, totalRevenue, totalCustomers, totalProducts,
  ordersToday, revenueToday,
  ordersByStatus: { pending: N, paid: N, shipped: N, ... },
  ordersByChannel: { online: N, pos: N, whatsapp: N },
  recentOrders: [...]
}
```

**Use Cases**: `GetDashboardUseCase`, `GetSalesReportUseCase`, `GetTopProductsUseCase`

**Imports**: CustomersModule, StaffModule, OrdersModule, ProductsModule (accede via repository tokens exportados)

**Nota**: Los reportes de ventas incluyen tanto ordenes online como POS/WhatsApp. Se puede filtrar por `channel` en `GetSalesReportUseCase`.
