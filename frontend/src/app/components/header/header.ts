import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';   


@Component({
    selector: 'app-header',
    standalone: true,
    imports: [ CommonModule],
    templateUrl: './header.html',
    styleUrl: './header.css'
})
export class HeaderComponent implements OnInit {
    @Input() userName: string = '';
    @Output() logoutClick = new EventEmitter<void>();

    constructor(private router: Router) { }

    ngOnInit(): void {
    }

    onLogout(): void {
        this.logoutClick.emit();
    }
}
