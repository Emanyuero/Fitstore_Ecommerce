import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-owner-profile',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './owner-profile.html',
  styleUrls: ['./owner-profile.css'], 
})
export class OwnerProfile {
  name: string = localStorage.getItem('name') || '';

  constructor(private router: Router) {}

  logout() {
    localStorage.clear();
    alert('You have logged out successfully.');
    this.router.navigate(['/login']);
  }
    goHome() {
    this.router.navigate(['/owner-dashboard']);
  }
}
