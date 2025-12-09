import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { OwnerDashboard } from './pages/owner-dashboard/owner-dashboard';
import { CustomerDashboard } from './pages/customer-dashboard/customer-dashboard';
import { CreateProduct } from './pages/create-product/create-product';
import { CustomerCart } from './pages/customer-cart/customer-cart';
import { OrdersComponent } from './pages/order-component/order-component';
import { InventoryComponent } from './pages/inventory-component/inventory-component';
import { SalesComponent } from './pages/sales-report/sales-report';
import { CustomerOrders } from './pages/customer-orders/customer-orders';
import { OrderDetails } from './pages/order-details/order-details';
import { EditProduct } from './pages/edit-product/edit-product';
import { AuthGuard } from './guard/auth-guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Owner / Business routes
  {
    path: 'owner-dashboard',
    component: OwnerDashboard,
    canActivate: [AuthGuard],
    data: { roles: ['owner', 'business'] }
  },
  {
    path: 'create-product',
    component: CreateProduct,
    canActivate: [AuthGuard],
    data: { roles: ['owner', 'business'] }
  },
  {
    path: 'order-component',
    component: OrdersComponent,
    canActivate: [AuthGuard],
    data: { roles: ['owner', 'business'] }
  },
  {
    path: 'inventory-component',
    component: InventoryComponent,
    canActivate: [AuthGuard],
    data: { roles: ['owner', 'business'] }
  },
  {
    path: 'sales-report',
    component: SalesComponent,
    canActivate: [AuthGuard],
    data: { roles: ['owner', 'business'] }
  },
  {
    path: 'edit-product/:id',
    component: EditProduct,
    canActivate: [AuthGuard],
    data: { roles: ['owner', 'business'] }
  },

  // Customer routes
  {
    path: 'customer-dashboard',
    component: CustomerDashboard,
    canActivate: [AuthGuard],
    data: { roles: ['customer'] }
  },
  {
    path: 'customer-cart',
    component: CustomerCart,
    canActivate: [AuthGuard],
    data: { roles: ['customer'] }
  },
  {
    path: 'customer-orders',
    component: CustomerOrders,
    canActivate: [AuthGuard],
    data: { roles: ['customer'] }
  },
  {
    path: 'order-details/:id',
    component: OrderDetails,
    canActivate: [AuthGuard],
    data: { roles: ['customer', 'owner', 'business'] }
  },

  { path: '**', redirectTo: 'login' }
];
