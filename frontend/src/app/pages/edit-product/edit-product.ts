import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../../services/product/product';
import { AlertService } from '../../services/alert/alert';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../components/footer/footer';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header';

@Component({
  selector: 'app-edit-product',
  imports: [CommonModule, HeaderComponent, FooterComponent, ReactiveFormsModule],
  templateUrl: './edit-product.html',
})
export class EditProduct implements OnInit {
  name: string = localStorage.getItem('name') || '';
  productId: number = 0;

  productForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl(''),
    price: new FormControl(0, [Validators.required, Validators.min(0)]),
    category: new FormControl(''),
    stock_quantity: new FormControl(0, [Validators.required, Validators.min(0)])
  });

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private alert: AlertService,
    private router: Router
  ) {}

  ngOnInit() {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.getById(this.productId).subscribe(res => {
      if (res.status === 'success') {
        this.productForm.patchValue(res.product);
      } else {
        this.alert.error('Product not found.');
        this.router.navigate(['/inventory']);
      }
    });
  }

  onSubmit() {
    if (this.productForm.invalid) {
      return this.alert.warning('Please fill in all required fields.');
    }

    const product: Product = this.productForm.value;
    this.productService.updateProduct(this.productId, product).subscribe({
      next: () => {
        this.alert.success('Product updated successfully!');
        console.log(product);
        this.router.navigate(['/owner-dashboard']);
      },
      error: () => this.alert.error('Failed to update product.'),
    });
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
