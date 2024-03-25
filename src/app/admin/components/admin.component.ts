import { Component, inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService, User } from '@auth0/auth0-angular';
import { shareReplay } from 'rxjs/operators';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

    user$: Observable<User | null | undefined>;

    private authService: AuthService = inject(AuthService);

    ngOnInit() {
        localStorage.setItem('route', `${window.location.href.split(window.location.origin).pop()}`);

        this.user$ = this.authService.user$.pipe(shareReplay(1));
    }

}
