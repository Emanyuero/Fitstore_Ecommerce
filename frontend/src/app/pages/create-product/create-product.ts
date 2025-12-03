import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { Router } from '@angular/router';
import { AlertService } from '../../services/alert/alert';

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent],
  templateUrl: './create-product.html',
  styleUrls: ['./create-product.css']
})
export class CreateProduct implements OnInit {
  name: string = localStorage.getItem('name') || '';
  productForm!: FormGroup;
  stock_quantity: number = 0;
  price: number = 0;
  id: number = 0;
  description: any;
  category: any;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private alert: AlertService
  ) { }

  ngOnInit() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      category: ['', Validators.required],
      stock_quantity: [null, [Validators.required, Validators.min(0)]]
    });
  }

  logout() {
    localStorage.clear();
    this.alert.success('You have logged out successfully.');
    this.router.navigate(['/']);
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.alert.warning('Please fill all required fields correctly.');
      return;
    }

    const product = this.productForm.value;

    this.http.post('http://localhost:3000/api/products', product).subscribe({
      next: () => {
        this.alert.success('Product created successfully!');
        this.productForm.reset();
        this.router.navigate(['/owner-dashboard']);
      },
      error: () => {
        this.alert.error('Error creating product.');
      }
    });
  }
}
