import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { OwnerDashboard } from './pages/owner-dashboard/owner-dashboard';
import { CustomerDashboard } from './pages/customer-dashboard/customer-dashboard';
import { CreateProduct } from './pages/create-product/create-product';
import { CustomerProfile } from './pages/customer-profile/customer-profile';
import { CustomerCart } from './pages/customer-cart/customer-cart';
import { OwnerProfile } from './pages/owner-profile/owner-profile';
import { OrdersComponent } from './pages/order-component/order-component';
import { InventoryComponent } from './pages/inventory-component/inventory-component';
import { SalesComponent } from './pages/sales-report/sales-report';
import { CustomerOrders } from './pages/customer-orders/customer-orders';
import { OrderDetails } from './pages/order-details/order-details';
import { EditProduct } from './pages/edit-product/edit-product';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'owner-dashboard', component: OwnerDashboard },
  { path: 'customer-dashboard', component: CustomerDashboard },
  { path: 'create-product', component: CreateProduct },
  { path: 'customer-profile', component: CustomerProfile },
  { path: 'customer-cart', component : CustomerCart},
  { path: 'owner-profile', component : OwnerProfile},
  { path: 'order-component', component : OrdersComponent},
  { path:  'inventory-component', component : InventoryComponent},
  { path: 'sales-report', component: SalesComponent },
  { path: 'customer-orders', component: CustomerOrders }, 
  { path: 'order-details/:id', component: OrderDetails },
  { path: 'edit-product/:id', component: EditProduct },
];
