import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService, Order, OrderItem } from '../../services/order/order';
import { AlertService } from '../../services/alert/alert';
import { CustomerHeaderComponent } from '../../components/header/customer-header/customer-header';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../components/footer/footer';

@Component({
  selector: 'app-order-details',
  imports: [CustomerHeaderComponent, CommonModule, FooterComponent],
  templateUrl: './order-details.html',
})
export class OrderDetails implements OnInit {
  name: string = localStorage.getItem('name') || '';
  order: Order | null = null;
  items: OrderItem[] = [];
  orderId: number = 0;
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private alert: AlertService,
    private router: Router
  ) {}

  ngOnInit() {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrder();
  }

loadOrder() {
  this.loading = true;
  this.orderService.getOrderById(this.orderId).subscribe({
    next: (res) => {
      this.loading = false;
      if (res.status === 'success' && res.order) {
        this.order = res.order;
        this.items = res.items || []; // <-- fix here
      } else {
        this.alert.error('Order not found.');
        this.router.navigate(['/customer-orders']);
      }
    },
    error: (err) => {
      this.loading = false;
      console.error(err);
      this.alert.error('Failed to load order.');
      this.router.navigate(['/customer-orders']);
    },
  });
}


  getOrderTotal(): number {
    return this.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  }

  cancelOrder() {
    if (!this.order) return;

    this.orderService.cancelOrder(this.order.id).subscribe({
      next: (res) => {
        this.alert.success('Order canceled successfully!');
        // Update local status without reload
        if (this.order) this.order.status = 'Cancelled';
        this.items = []; // optionally clear items if you want
      },
      error: () => this.alert.error('Failed to cancel order.'),
    });
  }

  goHome() {
    this.router.navigate(['/customer-dashboard']);
  }
  goBack() {
    window.history.back();
  }

  logout() {
    localStorage.clear();
    this.alert.success('You have logged out successfully.');
    this.router.navigate(['/']);
  }
}
