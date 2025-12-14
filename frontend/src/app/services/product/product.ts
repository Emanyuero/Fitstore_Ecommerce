import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id?: number;
  name: string;
  price: number;
  description: string;
  category: string;
  stock_quantity: number;
  image?: string;
}

// ✅ Inline Pagination interface
export interface ProductPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) { }

  // ✅ Get all products with pagination
  getAll(page: number = 1, limit: number = 9, searchTerm: string = '', selectedCategory: string = ''): Observable<{
    status: string;
    products: Product[];
    pagination: ProductPagination;
  }> {
    const params: string[] = [`page=${page}`, `limit=${limit}`];
    if (searchTerm && searchTerm.trim().length) params.push(`search=${encodeURIComponent(searchTerm.trim())}`);
    if (selectedCategory && selectedCategory.trim()) params.push(`category=${encodeURIComponent(selectedCategory.trim())}`);
    const url = `${this.apiUrl}?${params.join('&')}`;
    return this.http.get<{ status: string; products: Product[]; pagination: ProductPagination }>(url);
  }

  getById(id: number): Observable<{ status: string; product: Product }> {
    return this.http.get<{ status: string; product: Product }>(`${this.apiUrl}/${id}`);
  }

  create(product: Product): Observable<any> {
    return this.http.post(this.apiUrl, product);
  }

  updateProduct(id: number, product: Product): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, product);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  createImage(product: FormData) {
    return this.http.post(this.apiUrl, product);
  }
}
