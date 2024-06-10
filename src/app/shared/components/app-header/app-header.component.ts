import { Component, inject, input, OnInit } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-app-header',
    templateUrl: './app-header.component.html',
    styleUrls: ['./app-header.component.scss'],
    standalone: true,
    imports: [NgIf, RouterLinkActive, RouterLink, MatButtonModule, AsyncPipe, MatToolbarModule, MatMenuModule, MatIconModule]
})
export class AppHeaderComponent implements OnInit {

    user = input.required<User | null | undefined>();

    isAuthenticated$: Observable<boolean>;

    private authService: AuthService = inject(AuthService);

    ngOnInit(): void {
        this.isAuthenticated$ = this.authService.isAuthenticated$.pipe(
            shareReplay(1)
        );
    }

    login(): void {
        this.authService.loginWithRedirect({
            appState: {target: window.location.href.split(window.location.origin).pop()},
        });
    }

    logout(): void {
        this.authService.logout();
    }
}
