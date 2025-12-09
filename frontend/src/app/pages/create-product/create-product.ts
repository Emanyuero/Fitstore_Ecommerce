import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService, Product } from '../../services/product/product';
import { AlertService } from '../../services/alert/alert';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-product',
  imports: [CommonModule, HeaderComponent, FooterComponent, ReactiveFormsModule],
  templateUrl: './create-product.html',
})
export class CreateProduct {
  name: string = localStorage.getItem('name') || '';

  // Reactive form
  productForm: FormGroup;

  constructor(
    private productService: ProductService,
    private alert: AlertService,
    private router: Router
  ) {
    this.productForm = new FormGroup({
      name: new FormControl('', Validators.required),
      description: new FormControl(''),
      price: new FormControl(0, [Validators.required, Validators.min(0)]),
      category: new FormControl(''),
      stock_quantity: new FormControl(0, [Validators.required, Validators.min(0)])
    });
  }

    onSubmit() {
      if (this.productForm.invalid) {
        return this.alert.warning('Please fill in all required fields.');
      }

      const formData = new FormData();
      formData.append('name', this.productForm.value.name);
      formData.append('description', this.productForm.value.description);
      formData.append('price', this.productForm.value.price);
      formData.append('category', this.productForm.value.category);
      formData.append('stock_quantity', this.productForm.value.stock_quantity);

      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      this.productService.createImage(formData).subscribe({
        next: () => {
          this.alert.success('Product created successfully!');
          this.router.navigate(['/owner-dashboard']);
        },
        error: () => this.alert.error('Failed to create product.')
      });
    }


      selectedFile: File | null = null;

    onFileChange(event: any) {
      if (event.target.files && event.target.files.length) {
        this.selectedFile = event.target.files[0];
      }
    }


  logout() {
    localStorage.clear();
    this.alert.success('You have logged out successfully.');
    this.router.navigate(['/']);
  }
  goHome() {
    this.router.navigate(['/owner-dashboard']);
  }
}
