import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService, Product } from '../../services/product/product';
import { AlertService } from '../../services/alert/alert';
import { CustomerHeaderComponent } from '../../components/header/customer-header/customer-header';
import { FooterComponent } from '../../components/footer/footer';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchFilterPipe } from '../../services/pipes/searchfilter';
import { OrderService } from '../../services/order/order';



@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CustomerHeaderComponent, FooterComponent, CommonModule, FormsModule, SearchFilterPipe],
  templateUrl: './customer-dashboard.html'
})
export class CustomerDashboard implements OnInit {
  name: string = localStorage.getItem('name') || '';
  products: Product[] = [];
  cart: Product[] = [];
  searchTerm: string = '';

  constructor(
    private router: Router,
    private productService: ProductService,
    private alert: AlertService,
    private order: OrderService
  ) {}

  ngOnInit() {
    if ((localStorage.getItem('role') || '').toLowerCase() !== 'customer') {
      this.router.navigate(['/']);
    }
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getAll().subscribe({
      next: res => { if (res.status === 'success') this.products = res.products; },
      error: () => this.alert.error('Failed to load products.')
    });
  }

addToCart(product: Product) {
  const email = localStorage.getItem('email');
  if (!email) return;

  if (product.stock_quantity === 0) {
    this.alert.warning('This product is out of stock.');
    return;
  }

  // Check if product is already in cart
  const cartItem = this.cart.find(item => item.id === product.id);
  let quantityToAdd = 1;

  if (cartItem) {
    quantityToAdd = 1; // You can change this if you want to allow multiple adds at once
    cartItem.stock_quantity! += 1;
  } else {
    this.cart.push({...product, stock_quantity: 1});
  }

  this.order.addToCart(email, product.id!, quantityToAdd).subscribe({
    next: () => {
      product.stock_quantity! -= 1; // reduce the stock in UI
      const cartQty = this.cart.find(item => item.id === product.id)?.stock_quantity || 1;
      this.alert.success(`${product.name} added to cart. You now have ${cartQty} in your cart.`);
    },
    error: () => this.alert.error('Failed to add product to cart.')
  });
}


  goToCart() { this.router.navigate(['/customer-cart']); }
  goToOrders() { this.router.navigate(['/customer-orders']); }
  logout() {
    localStorage.clear();
    this.alert.success('You have logged out successfully.');
    this.router.navigate(['/']);
  }
}
