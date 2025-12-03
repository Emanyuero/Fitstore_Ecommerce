import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert/alert';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  product_id: number;
  stock_quantity: number;
}

@Component({
  selector: 'app-customer-cart',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './customer-cart.html'
})
export class CustomerCart implements OnInit {
  name: string = localStorage.getItem('name') || '';
  cart: CartItem[] = [];

  constructor(
    private router: Router,
    private http: HttpClient,
    private alert: AlertService
  ) { }

  ngOnInit() {
    const role = (localStorage.getItem('role') || '').toLowerCase();
    if (role !== 'customer') this.router.navigate(['/']);
    this.loadCart();
  }

  goHome() {
    this.router.navigate(['/customer-dashboard']);
  }

  logout() {
    localStorage.clear();
    this.alert.success('You have logged out successfully.');
    this.router.navigate(['/']);
  }

  loadCart() {
    const email = localStorage.getItem('email');
    if (!email) return;

    this.http.get<{ status: string, cart: CartItem[] }>(
      `http://localhost:3000/api/cart/${email}`
    ).subscribe(res => {
      if (res.status === 'success') {
        this.cart = res.cart.map(item => ({
          ...item,
          stock_quantity: item.stock_quantity || 0
        }));
      }
    });
  }

  removeItem(productId: number) {
    const email = localStorage.getItem('email');
    if (!email) return;

    this.http.delete(`http://localhost:3000/api/cart/remove/${email}/${productId}`)
      .subscribe(
        () => {
          this.loadCart();
          this.alert.success('Item removed from cart.');
        },
        (error) => this.alert.error('An error occurred while removing the item.')
      );
  }

  updateQuantity(item: CartItem, change: number) {
    const email = localStorage.getItem('email');
    if (!email) return;

    const newQty = item.quantity + change;
    if (newQty < 1) return;

    // frontend stock check
    if (newQty > item.stock_quantity) {
      this.alert.warning("Stock unavailable.");
      return;
    }

    this.http.put(`http://localhost:3000/api/cart/update`, {
      email,
      product_id: item.product_id || item.id,
      quantity: newQty
    }).subscribe((res: any) => {
      if (res.status === "failed") {
        this.alert.warning("Stock unavailable.");
        return;
      }
      this.loadCart();
    });
  }

  checkout() {
    const email = localStorage.getItem('email');
    if (!email) return;

    this.http.post(`http://localhost:3000/api/checkout`, { email })
      .subscribe((res: any) => {
        if (res.status === 'success') {
          this.alert.success('Checkout successful!');
          this.cart = [];
        } else {
          this.alert.error('Checkout failed.');
        }
      });
  }

  getTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
