import { Component, inject, Input, OnInit } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Component({
    selector: 'app-app-header',
    templateUrl: './app-header.component.html',
    styleUrls: ['./app-header.component.scss']
})
export class AppHeaderComponent implements OnInit {

    @Input() user: User | null | undefined;

    isAuthenticated$: Observable<boolean>;

    private authService: AuthService = inject(AuthService);

    ngOnInit(): void {
        this.isAuthenticated$ = this.authService.isAuthenticated$.pipe(shareReplay(1));
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
