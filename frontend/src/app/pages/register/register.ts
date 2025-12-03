import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert/alert';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  full_name = '';
  username = '';
  phone = '';
  address = '';
  gender = '';
  dob = '';
  email = '';
  password = '';
  confirmPassword = '';
  role = 'customer';

  constructor(private http: HttpClient, private router: Router, private alert: AlertService) { }

  reg() {
    if (!this.full_name || !this.username || !this.phone || !this.address || !this.gender ||
      !this.dob || !this.email || !this.password || !this.role) {
      this.alert.warning('Please fill in all required fields.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.alert.error('Passwords do not match.');
      return;
    }

    const user = {
      full_name: this.full_name,
      username: this.username,
      phone: this.phone,
      address: this.address,
      gender: this.gender,
      dob: this.dob,
      email: this.email,
      password: this.password,
      role: this.role
    };

    this.http.post('http://localhost:3000/api/register', user)
      .subscribe({
        next: (res: any) => {
          this.alert.success(res.message || 'Registration successful');
          this.router.navigate(['/login']);
        },
        error: () => this.alert.error('Registration failed. Please try again.')
      });
  }
}
