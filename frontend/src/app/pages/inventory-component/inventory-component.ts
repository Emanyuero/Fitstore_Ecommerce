import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert/alert';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './inventory-component.html'
})
export class InventoryComponent implements OnInit, OnDestroy {
  name: string = localStorage.getItem('name') || '';
  inventoryLogs: any[] = [];
  private refreshSub!: Subscription;

  constructor(private http: HttpClient, private router: Router , private alert: AlertService) { }

  ngOnInit() {
    this.loadInventoryLogs();
    setInterval(() => this.loadInventoryLogs(), 5000);
  }

  ngOnDestroy() {
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }
  
  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
  goBack() {
  window.history.back();
}


  loadInventoryLogs() {
    this.http.get<any>('http://localhost:3000/api/inventory').subscribe({
      next: (res) => { if(res.status === 'success') this.inventoryLogs = res.logs; },
      error: (err) => console.error(err)
    });
  }
}

