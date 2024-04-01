import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { filter, shareReplay, switchMap, tap } from 'rxjs/operators';
import { ActivatedRoute, Data, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [RouterOutlet]
})
export class AppComponent implements OnInit {

    private authService: AuthService = inject(AuthService);
    private activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private router: Router = inject(Router);

    ngOnInit(): void {
        const routeData$: Observable<Data> = this.router.events.pipe(
            filter(e => e instanceof NavigationEnd),
            switchMap(() =>
                this.activatedRoute.firstChild ? this.activatedRoute.firstChild.data : this.activatedRoute.data
            ),
            shareReplay(1)
        );

        combineLatest([
            this.authService.isAuthenticated$,
            routeData$
        ]).pipe(
            tap(([isAuthenticated, data]: [boolean, Data]) => {
                if (!data.skipAuth && !isAuthenticated) {
                    this.authService.loginWithRedirect({
                        appState: {target: localStorage.getItem('route') ?? window.location.origin},
                    });
                }
            })
        ).subscribe();
    }
}


