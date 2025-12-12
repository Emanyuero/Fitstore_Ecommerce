import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { interval, Subscription, forkJoin } from 'rxjs';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { ProductService, Product } from '../../services/product/product';
import { OrderService, Order, OrderItem } from '../../services/order/order';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './inventory-component.html'
})
export class InventoryComponent implements OnInit, OnDestroy {
  name: string = localStorage.getItem('name') || '';
  inventorySummary: { category: string, totalStock: number, lowStock: number }[] = [];
  inventoryLogs: any[] = [];
  private refreshSub!: Subscription;

  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadData();
    this.refreshSub = interval(10000).subscribe(() => this.loadData());
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

  loadData() {
    forkJoin({
      products: this.productService.getAll(),
      orders: this.orderService.getAllOrders(),
      inventory: this.http.get<any>('http://localhost:3000/api/inventory')
    }).subscribe({
      next: ({ products, orders, inventory }) => {
        if (products.status === 'success') this.generateInventorySummary(products.products);
        if (inventory.status === 'success') this.inventoryLogs = inventory.logs;
      },
      error: (err) => console.error(err)
    });
  }

  generateInventorySummary(products: Product[]) {
    const summaryMap: Record<string, { totalStock: number; lowStock: number }> = {};
    products.forEach(p => {
      const stock = Number(p.stock_quantity || 0); 
      const category = p.category || 'Uncategorized';
      
      if (!summaryMap[category]) summaryMap[category] = { totalStock: 0, lowStock: 0 };

      summaryMap[category].totalStock += stock;

      if (stock <= 10) summaryMap[category].lowStock += 1;
    });

    this.inventorySummary = Object.keys(summaryMap).map(key => ({
      category: key,
      totalStock: summaryMap[key].totalStock,
      lowStock: summaryMap[key].lowStock
    }));
  }
}
