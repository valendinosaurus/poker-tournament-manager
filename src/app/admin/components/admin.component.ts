import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

    private authService: AuthService = inject(AuthService);

    ngOnInit() {
        localStorage.setItem('route', `${window.location.href.split(window.location.origin).pop()}`);
    }

    logout(): void {
        this.authService.logout();
    }

}
