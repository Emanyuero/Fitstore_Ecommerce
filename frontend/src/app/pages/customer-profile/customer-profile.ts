import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './customer-profile.html',
  styleUrl: './customer-profile.css',
})
export class CustomerProfile {
  email: string = '';
  username: string = '';
  fullname: string = '';

  ngOnInit() {
      const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.email = user.email;
      this.username = user.username;
      this.fullname = `${user.first_name} ${user.last_name}`;
    }
  } 
}