import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  constructor() { }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!localStorage.getItem('email');
  }

  // Get current user role
  getRole(): string {
    return localStorage.getItem('role') || '';
  }

  // Get current user email
  getEmail(): string {
    return localStorage.getItem('email') || '';
  }

  // Logout
  logout(): void {
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
  }
}
