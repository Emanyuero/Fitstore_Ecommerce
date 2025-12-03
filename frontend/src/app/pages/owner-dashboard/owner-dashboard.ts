import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';
import { AlertService } from '../../services/alert/alert';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  stock_quantity: number;
  image?: string;
}

@Pipe({ name: 'searchFilter', standalone: true })
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
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    SearchFilterPipe
  ],
  templateUrl: './owner-dashboard.html'
})
export class OwnerDashboard implements OnInit {
  name: string = localStorage.getItem('name') || '';
  products: Product[] = [];
  showModal = false;
  productForm!: FormGroup;
  editingProduct: Product | null = null;
  searchTerm: string = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder,
    private alert: AlertService
  ) { }

  ngOnInit() {
    const role = (localStorage.getItem('role') || '').toLowerCase();
    if (!['owner', 'business', 'admin'].includes(role)) {
      this.router.navigate(['/']);
    }

    this.loadProducts();

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      category: ['', Validators.required],
      stock_quantity: [null, [Validators.required, Validators.min(0)]],
      image: ['']
    });
  }

  logout() {
    localStorage.clear();
    this.alert.success('You have logged out successfully.');
    this.router.navigate(['/login']);
  }

  goHome() {
    this.router.navigate(['/owner-dashboard']);
  }

  goProfile() {
    this.router.navigate(['/owner-profile']);
  }

  openCreateModal() {
    this.editingProduct = null;
    this.productForm.reset();
    this.showModal = true;
  }

  openEditModal(product: Product) {
    this.editingProduct = product;
    this.productForm.patchValue(product);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  loadProducts() {
    this.http.get<any>('http://localhost:3000/api/products').subscribe(res => {
      if (res.status === 'success') this.products = res.products;
    }, err => {
      this.alert.error('Failed to load products.');
    });
  }

  submitProduct() {
    if (this.productForm.invalid) {
      this.alert.warning('Please fill all fields.');
      return;
    }

    const productData = this.productForm.value;

    if (this.editingProduct) {
      this.http.put(`http://localhost:3000/api/products/${this.editingProduct.id}`, productData)
        .subscribe({
          next: () => {
            this.alert.success('Product updated successfully!');
            this.closeModal();
            this.loadProducts();
          },
          error: () => this.alert.error('Failed to update product.')
        });
    } else {
      this.http.post('http://localhost:3000/api/products', productData)
        .subscribe({
          next: () => {
            this.alert.success('Product created successfully!');
            this.closeModal();
            this.loadProducts();
          },
          error: () => this.alert.error('Failed to create product.')
        });
    }
  }

  deleteProduct(id: number) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    this.http.delete(`http://localhost:3000/api/products/${id}`).subscribe({
      next: () => {
        this.alert.success('Product deleted successfully!');
        this.loadProducts();
      },
      error: () => this.alert.error('Failed to delete product.')
    });
  }
}
