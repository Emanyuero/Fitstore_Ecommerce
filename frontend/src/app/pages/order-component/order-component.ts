import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert/alert';
import { interval, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, FormsModule],
  templateUrl: './order-component.html'
})
export class OrdersComponent implements OnInit, OnDestroy {
  name: string = localStorage.getItem('name') || '';
  orders: any[] = [];
  itemsByOrder: { [key: number]: any[] } = {};
  private refreshSub!: Subscription;

  constructor(private http: HttpClient, private router: Router, private alert: AlertService) {}

ngOnInit() {
  this.loadOrders();
  setInterval(() => this.loadOrders(), 5000); // refresh every 5 seconds
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


  loadOrders() {
    this.http.get<any>('http://localhost:3000/api/orders').subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.orders = res.orders;
          this.orders.forEach(order => {
            this.http.get<any>(`http://localhost:3000/api/order_items/${order.id}`).subscribe({
              next: (res) => { if (res.status === 'success') this.itemsByOrder[order.id] = res.items; },
              error: () => this.alert.error(`Failed to load items for order #${order.id}`)
            });
          });
        }
      },
      error: () => this.alert.error('Failed to load orders.')
    });
  }

  getOrderTotal(orderId: number): number {
    const items = this.itemsByOrder[orderId] || [];
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

    updateStatus(orderId: number, status: string) {
    this.http.put<any>(
      `http://localhost:3000/api/orders/${orderId}/status`,
      { status }
    ).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.alert.success(`Order #${orderId} updated to ${status}`);
        }
      },
      error: () => this.alert.error('Failed to update status')
    });
  }
}


