import { inject, Injectable } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthUtilService {

    private authService: AuthService = inject(AuthService);

    getUser$(): Observable<User> {
        return this.authService.user$.pipe(
            filter((user: User | undefined | null): user is User => user !== null && user !== undefined),
            shareReplay(1)
        );
    }

    getSub$(): Observable<string> {
        return this.getUser$().pipe(
            map((user: User) => user.sub),
            filter((sub: string | undefined): sub is string => sub !== undefined),
            shareReplay(1)
        );
    }
}
