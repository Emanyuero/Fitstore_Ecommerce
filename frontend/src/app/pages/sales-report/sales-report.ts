import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert/alert';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './sales-report.html'
})
export class SalesComponent implements OnInit, OnDestroy {
  name: string = localStorage.getItem('name') || '';
  salesReports: any[] = [];
  private refreshSub!: Subscription;

  constructor(private http: HttpClient, private router: Router, private alert: AlertService) {}

  ngOnInit() {
    this.loadSalesReports();
    setInterval(() => this.loadSalesReports(), 5000);
  }

  ngOnDestroy() {
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }
    logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  loadSalesReports() {
    this.http.get<any>('http://localhost:3000/api/sales-reports').subscribe({
      next: (res) => { if(res.status === 'success') this.salesReports = res.reports; },
      error: () => this.alert.error('Failed to load sales reports.')
    });
  }
}
