import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Auth } from '../services/auth/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private auth: Auth, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const expectedRoles: string[] = route.data['roles'];
    const userRole = this.auth.getRole().toLowerCase();

    if (expectedRoles && !expectedRoles.includes(userRole)) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
