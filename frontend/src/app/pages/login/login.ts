import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert/alert';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;

  constructor(private http: HttpClient, private router: Router, private alert: AlertService) { }

  onSubmit() {
    if (!this.email || !this.password) {
      this.alert.error('Please enter both email and password.');
      return;
    }

    this.http.post<any>('http://localhost:3000/api/login', {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.alert.success(res.message || 'Login successful');

          localStorage.setItem('role', res.role);
          localStorage.setItem('name', res.name);
          localStorage.setItem('email', this.email);

          const role = (res.role || '').toLowerCase();

          if (['owner', 'business'].includes(role)) {
            this.router.navigate(['/owner-dashboard']);
          } else {
            this.router.navigate(['/customer-dashboard']);
          }
        } else {
          this.alert.error(res.error || 'Invalid email or password');
        }
      },
      error: () => {
        this.alert.error('Server error, please try again.');
      }
    });
  }
}
