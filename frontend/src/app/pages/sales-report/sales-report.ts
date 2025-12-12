import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProductService, Product } from '../../services/product/product';
import { OrderService, Order } from '../../services/order/order';
import { interval, Subscription, forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, NgxChartsModule],
  templateUrl: './sales-report.html'
})
export class SalesComponent implements OnInit, OnDestroy {
  name: string = localStorage.getItem('name') || '';
  totalProducts: number = 0;
  totalValue: number = 0;
  lowStockItems: number = 0;
  totalSales: number = 0;

  // MUST be name + value for ngx-charts
  salesData: { name: string; value: number }[] = [];
  categoryData: { name: string; value: number }[] = [];

  private refreshSub!: Subscription;

  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboard();
    this.refreshSub = interval(10000).subscribe(() => this.loadDashboard());
  }

  ngOnDestroy() {
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  goBack() {
    window.history.back();
  }

  loadDashboard() {
    forkJoin({
      products: this.productService.getAll(),
      orders: this.orderService.getAllOrders()
    }).subscribe({
      next: ({ products, orders }) => {
        if (products.status === 'success') this.calculateProductMetrics(products.products);
        if (orders.status === 'success') this.calculateSalesMetrics(orders.orders);
      },
      error: (err) => console.error(err)
    });
  }

  private calculateProductMetrics(products: Product[]) {
    this.totalProducts = products.length;
    this.totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
    this.lowStockItems = products.filter(p => p.stock_quantity <= 10).length;

    const categoryMap: Record<string, number> = {};

    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = 0;
      categoryMap[cat] += 1;
    });

    // ngx-charts only accepts name/value format
    this.categoryData = Object.keys(categoryMap).map(cat => ({
      name: cat,
      value: categoryMap[cat]
    }));
  }

  private calculateSalesMetrics(orders: Order[]) {
    this.totalSales = 0;

    const monthlyMap: Record<string, number> = {};

    orders.forEach(order => {
      const date = new Date(order.order_date);
      const month = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!monthlyMap[month]) monthlyMap[month] = 0;

      if (order.items?.length) {
        const orderTotal = order.items.reduce((sum, item) => sum + item.price! * item.quantity, 0);
        monthlyMap[month] += orderTotal;
        this.totalSales += orderTotal;
      }
    });

    // Fix: MUST use name + value for ngx-charts
    this.salesData = Object.keys(monthlyMap)
      .sort()
      .map(month => ({
        name: month,
        value: monthlyMap[month]
      }));
  }
}
