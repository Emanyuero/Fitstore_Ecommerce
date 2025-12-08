import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-header',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './customer-header.html',
  styleUrls: ['./customer-header.css']
})
export class CustomerHeaderComponent implements OnInit {
  
  @Input() userName: string = '';
  @Output() logoutClick = new EventEmitter<void>();
  

  constructor(private router: Router) {}

  ngOnInit(): void {}

  onLogout(): void {
    this.logoutClick.emit();
  }
}
