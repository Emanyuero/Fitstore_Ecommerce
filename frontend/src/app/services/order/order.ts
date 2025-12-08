    import { Injectable } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { Observable } from 'rxjs';

    export interface Order {
      id: number;
      user_id: number;
      order_date: string;
      status?: string;
      customer_name?: string;
      total_amount?: number;
      items?: OrderItem[];
    }

    export interface OrderItem {
      id: number;
      order_id: number;
      product_id: number;
      quantity: number;
      product_name?: string;
      price?: number;
      item?: OrderItem;
      total_amount?: number;
      is_active?: boolean;
    }

    export interface CartItem {
      product_id: number;
      name?: string;
      price?: number;
      quantity: number;
      stock_quantity?: number;
      is_active?: boolean;
    }

    @Injectable({
      providedIn: 'root'
    })
    export class OrderService {
      private apiUrl = 'http://localhost:3000/api';

      constructor(private http: HttpClient) {}

      // Cart
      getCart(email: string): Observable<{ status: string; cart: CartItem[] }> {
        return this.http.get<{ status: string; cart: CartItem[] }>(`${this.apiUrl}/cart/${email}`);
      }

      addToCart(email: string, productId: number, quantity: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/cart/add`, { email, product_id: productId, quantity });
      }

      updateCart(email: string, productId: number, quantity: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/cart/update`, { email, product_id: productId, quantity });
      }

      removeFromCart(email: string, productId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/cart/remove/${email}/${productId}`);
      }

    checkout(email: string): Observable<any> {
      return this.http.post(`${this.apiUrl}/checkout`, { email });
    }
      // Orders
      getOrdersByEmail(email: string): Observable<{ status: string; orders: Order[] }> {
        return this.http.get<{ status: string; orders: Order[] }>(`${this.apiUrl}/orders/${email}`);
      }

      getAllOrders(): Observable<{ status: string; orders: Order[] }> {
        return this.http.get<{ status: string; orders: Order[] }>(`${this.apiUrl}/orders`);
      }

        getOrderById(orderId: number): Observable<{ status: string; order: Order; items: OrderItem[] }> {
          return this.http.get<{ status: string; order: Order; items: OrderItem[] }>(
            `${this.apiUrl}/orders/${orderId}/details`
          );
        }



      updateStatus(orderId: number, status: string): Observable<{ status: string; message: string }> {
        return this.http.put<{ status: string; message: string }>(`${this.apiUrl}/orders/update_status/${orderId}`, { status });
      }

      cancelOrder(orderId: number): Observable<{ status: string; message: string }> {
        return this.http.put<{ status: string; message: string }>(`${this.apiUrl}/orders/cancel/${orderId}`, {});
      }
    }
