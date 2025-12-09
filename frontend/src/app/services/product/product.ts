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

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ status: string; products: Product[] }> {
    return this.http.get<{ status: string; products: Product[] }>(this.apiUrl);
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
    return this.http.post(this.apiUrl, product); // use full URL
  }
}
