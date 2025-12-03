import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CreateProduct } from '../create-product/create-product';
import { Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert/alert';

@Pipe({
  name: 'searchFilter',
  standalone: true
})
export class SearchFilterPipe implements PipeTransform {
  transform(items: any[], searchTerm: string): any[] {
    if (!items || !searchTerm) return items;
    searchTerm = searchTerm.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    );
  }
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule, SearchFilterPipe],
  templateUrl: './customer-dashboard.html'
})
export class CustomerDashboard implements OnInit {
  name: string = localStorage.getItem('name') || '';
  products: CreateProduct[] = [];
  cart: CreateProduct[] = [];
  searchTerm: string = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private alert: AlertService
  ) { }

  ngOnInit() {
    const role = (localStorage.getItem('role') || '').toLowerCase();
    if (!['customer'].includes(role)) {
      this.router.navigate(['/']);
    }
    this.loadProducts();
  }

  logout() {
    localStorage.clear();
    this.alert.success('You have logged out successfully.');
    this.router.navigate(['/']);
  }

  goHome() { this.router.navigate(['/customer-dashboard']); }
  goCart() { this.router.navigate(['/customer-cart']); }
  goProfile() { this.router.navigate(['/customer-profile']); }

  loadProducts() {
    this.http.get<any>('http://localhost:3000/api/products').subscribe(res => {
      if (res.status === 'success') {
        this.products = res.products;
      }
    });
  }

  addToCart(product: CreateProduct) {
    if (product.stock_quantity === 0) {
      this.alert.warning('This product is out of stock.');
      return;
    }

    const email = localStorage.getItem('email');
    if (!email) return;

    this.http.post('http://localhost:3000/api/cart/add', {
      email,
      product_id: product.id,
      quantity: 1
    }).subscribe({
      next: () => {
        this.alert.success(`You have added ${product.name} to your cart.`);
        product.stock_quantity -= 1;
      },
      error: () => this.alert.error('Failed to add product to cart.')
    });
  }

  removeFromCart(index: number) {
    const removed = this.cart.splice(index, 1)[0];
    const product = this.products.find(p => p.id === removed.id);
    if (product) {
      product.stock_quantity += 1;
    }
  }

  getTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price, 0);
  }
}
