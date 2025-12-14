import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert/alert';
import { ProductService, ProductPagination } from '../../services/product/product';
import { OrderService } from '../../services/order/order';
import { SearchFilterPipe } from '../../services/pipes/search-pipe';
import { CategoryFilterPipe } from '../../services/pipes/category-pipe';



@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    SearchFilterPipe,
    CategoryFilterPipe
  ],
  templateUrl: './owner-dashboard.html'
})
export class OwnerDashboard implements OnInit {
  name: string = localStorage.getItem('name') || '';
  searchTerm: string = '';
  products: any[] = [];
  order: any[] = [];
  selectedCategory: string = '';
  pagination: ProductPagination | null = null;
  currentPage = 1;
  limit = 9;



  constructor(
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder,
    private alert: AlertService,
    private orders: OrderService,
    private productService: ProductService

  ) { }

  ngOnInit() {
    if ((localStorage.getItem('role') || '').toLowerCase() !== 'owner') this.router.navigate(['/']);
    this.loadProducts();
    this.loadOrders();
  }

  // called when user changes category via UI
  selectCategory(category: string) {
    this.selectedCategory = category;
    this.loadProducts(1);
  }

  onSearchChange(term: string) {
    this.searchTerm = term;
    this.loadProducts(1);
  }

  loadProducts(page: number = 1) {
    this.productService.getAll(page, this.limit, this.searchTerm, this.selectedCategory)
      .subscribe({
        next: res => {
          if (res.status === 'success') {
            this.products = res.products;
            this.pagination = res.pagination;
            this.currentPage = res.pagination.currentPage;
          }
        }
      });
  }


  changePage(page: number) {
    if (!this.pagination) return;
    if (page < 1 || page > this.pagination.totalPages) return;
    this.currentPage = page;
    this.loadProducts(page);
  }


  loadOrders() { this.orders.getAllOrders().subscribe(res => this.order = res.orders); }

  viewOrder(orderId: number) { this.router.navigate([`/order-details/${orderId}`]); }

  navigateTo(section: string) {
    switch (section) {
      case 'addProduct':
        this.router.navigate(['/create-product']);
        break;
      case 'orders':
        this.router.navigate(['/order-component']);
        break;
      case 'inventory':
        this.router.navigate(['/inventory-component']);
        break;
      case 'sales':
        this.router.navigate(['sales-report']);
        break;
    }
  }
  editProduct(id: number) {
    this.router.navigate([`/edit-product/${id}`]);
  }

  deleteProduct(id: number) {
    this.alert.confirm('Are you sure you want to delete this product?').then(confirmed => {
      if (!confirmed) return;

      this.productService.delete(id).subscribe({
        next: (res: any) => {
          if (res.status === 'success') {
            this.alert.success('Product deleted successfully.');
            this.loadProducts(); // reload the products
          } else {
            this.alert.error(res.message || 'Failed to delete product.');
          }
        },
        error: (err) => {
          console.error(err);
          this.alert.error('An error occurred while deleting the product.');
        }
      });
    });
  }



  logout() {
    localStorage.clear();
    this.alert.success('You have logged out successfully.');
    this.router.navigate(['/login']);
  }
}







