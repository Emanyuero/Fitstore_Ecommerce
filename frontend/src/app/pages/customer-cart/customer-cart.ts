import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService, CartItem } from '../../services/order/order';
import { AlertService } from '../../services/alert/alert';
import { CustomerHeaderComponent } from '../../components/header/customer-header/customer-header';
import { FooterComponent } from '../../components/footer/footer';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-customer-cart',
  imports: [CustomerHeaderComponent, FooterComponent, CommonModule],
  templateUrl: './customer-cart.html',
})
export class CustomerCart implements OnInit {
  name: string = localStorage.getItem('name') || '';
  cart: CartItem[] = [];
  total: number = 0;

  constructor(
    private orderService: OrderService,
    private alert: AlertService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    const email = localStorage.getItem('email')!;
    this.orderService.getCart(email).subscribe(res => {
      this.cart = res.cart || [];
      this.calculateTotal();
    });
  }

  calculateTotal() {
    this.total = this.cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  }

  updateQuantity(item: CartItem, change: number) {
    const newQty = item.quantity + change;
    if (newQty < 1 || (item.stock_quantity && newQty > item.stock_quantity)) return;

    // Update locally for immediate UI feedback
    item.quantity = newQty;
    this.calculateTotal();

    // Sync with backend
    const email = localStorage.getItem('email')!;
    this.orderService.updateCart(email, item.product_id, newQty).subscribe({
      next: () => {},
      error: () => {
        this.alert.error('Failed to update quantity.');
        // revert if server fails
        item.quantity -= change;
        this.calculateTotal();
      }
    });
  }

  removeItem(item: CartItem) {
    // Remove locally
    this.cart = this.cart.filter(ci => ci.product_id !== item.product_id);
    this.calculateTotal();

    const email = localStorage.getItem('email')!;
    this.orderService.removeFromCart(email, item.product_id).subscribe({
      next: () => this.alert.success(`${item.name} removed from cart`),
      error: () => this.alert.error('Failed to remove item')
    });
  }

checkout() {
  // Filter out items that are unavailable (missing is_active defaults to true)
  const unavailableItems = this.cart.filter(i => i.is_active === false);
  if (unavailableItems.length > 0) {
    this.alert.error('Some items are unavailable. Please remove them first.');
    return;
  }

  const email = localStorage.getItem('email')!;
  this.orderService.checkout(email).subscribe({
    next: () => {
      this.alert.success('Checkout successful!');
      this.cart = [];
      this.total = 0;
      this.router.navigate(['/customer-orders']);
    },
    error: () => this.alert.error('Checkout failed'),
  });
}



  logout() {
    localStorage.clear();
    this.alert.success('You have logged out successfully.');
    this.router.navigate(['/']);
  }

  goHome() {
    this.router.navigate(['/customer-dashboard']);
  }
}
