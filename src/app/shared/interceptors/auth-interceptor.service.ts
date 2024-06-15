import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Observable, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthInterceptorService implements HttpInterceptor {

    private auth: AuthService = inject(AuthService);

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        return (req.url.includes('series/details/pw') || req.url.includes('series/meta/pw'))
            ? next.handle(req)
            : this.auth.getAccessTokenSilently().pipe(
                mergeMap((token: string) => {
                    const tokenReq = req.clone({
                        setHeaders: {
                            Authorization: `Bearer ${token}`,
                            token: token
                        }
                    });
                    return next.handle(tokenReq);
                }),
                catchError(err => throwError(err))
            );
    }
}
