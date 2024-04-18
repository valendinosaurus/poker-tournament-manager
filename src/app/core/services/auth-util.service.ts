import { inject, Injectable } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthUtilService {

    private authService: AuthService = inject(AuthService);

    getIsAuthenticated$(): Observable<boolean> {
        return this.authService.isAuthenticated$;
    }

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

    getEmail$(): Observable<string | undefined> {
        return this.getUser$().pipe(
            map((user: User) => user.email),
            shareReplay(1)
        );
    }

    getRoles$(): Observable<string[]> {
        return this.getUser$().pipe(
            map((user: User) => user['https://poker.rugolo.ch/roles'])
        );
    }

    isAdmin$(): Observable<boolean> {
        return this.getRoles$().pipe(
            map((roles: string[]) => roles.includes('admin'))
        );
    }

    isPro$(): Observable<boolean> {
        return this.getRoles$().pipe(
            map((roles: string[]) => roles.includes('pro'))
        );
    }
}
