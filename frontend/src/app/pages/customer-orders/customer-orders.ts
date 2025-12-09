import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService, Order } from '../../services/order/order';
import { AlertService } from '../../services/alert/alert';
import { CustomerHeaderComponent } from '../../components/header/customer-header/customer-header';
import { FooterComponent } from '../../components/footer/footer';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-orders',
  imports: [ CustomerHeaderComponent, FooterComponent, CommonModule],
  styleUrls: ['./customer-orders.css'],
  templateUrl: './customer-orders.html',
})
export class CustomerOrders implements OnInit {
  name: string = localStorage.getItem('name') || '';
  orders: Order[] = [];

  constructor(
    private orderService: OrderService,
    private router: Router,
    private alert: AlertService
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  allItemsUnavailable(order: Order): boolean {
    return order.items?.every(i => !i.is_active) ?? false;
  }

  loadOrders() {
    const email = localStorage.getItem('email')!;
    this.orderService.getOrdersByEmail(email).subscribe(res => this.orders = res.orders || []);
  }

  viewOrder(order: Order) {
    this.router.navigate([`/order-details/${order.id}`]);
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
