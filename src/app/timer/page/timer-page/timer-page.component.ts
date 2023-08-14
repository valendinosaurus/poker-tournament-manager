import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService, User } from '@auth0/auth0-angular';

@Component({
    selector: 'app-timer-page',
    templateUrl: './timer-page.component.html',
    styleUrls: ['./timer-page.component.scss']
})
export class TimerPageComponent implements OnInit {

    config$: Observable<{
        sub: string | undefined,
        password: string | undefined,
        tournamentId: number | undefined
    }>;

    private authService: AuthService = inject(AuthService);
    private route: ActivatedRoute = inject(ActivatedRoute);

    ngOnInit() {
        localStorage.setItem('route', `${window.location.href.split(window.location.origin).pop()}`);

        this.config$ = this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub),
            map((sub: string | undefined) => ({
                sub,
                password: this.route.snapshot.params['password'],
                tournamentId: this.route.snapshot.params['tId']
            }))
        );

        if (this.route.snapshot.params['tId'] && !this.route.snapshot.params['password']) {

        }
    }

}
