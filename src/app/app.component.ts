import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    private authService: AuthService = inject(AuthService);

    ngOnInit(): void {
        const href = window.location.href;

        this.authService.isAuthenticated$.pipe(
            tap((isAuthenticated: boolean) => {
                if (!href.includes('series') && !isAuthenticated) {
                    this.authService.loginWithRedirect({
                        appState: {target: window.location.href.split(window.location.origin).pop()},
                    });
                }
            })
        ).subscribe();
    }

}
