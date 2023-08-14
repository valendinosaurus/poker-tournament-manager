import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Branding } from '../../../shared/models/branding.interface';
import { AuthService, User } from '@auth0/auth0-angular';
import { map, switchMap } from 'rxjs/operators';
import { BrandingModel } from '../../../shared/models/branding-model.interface';

@Injectable({
    providedIn: 'root'
})
export class BrandingApiService {

    private readonly ENDPOINT = 'branding';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
    }

    getAll$(sub: string): Observable<Branding[]> {
        return this.http.get<Branding[]>(`${BACKEND_URL}${this.ENDPOINT}/${sub}`);
    }

    get$(id: number, sub: string): Observable<Branding> {
        return this.http.get<Branding>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`);
    }

    post$(branding: BrandingModel): Observable<any> {
        return this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.http.post<any>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...branding,
                    sub
                })
            ))
        );
    }

    put$(branding: Branding): Observable<any> {
        return this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.http.put<any>(`${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...branding,
                    sub
                })
            ))
        );
    }

    delete$(id: number, sub: string): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`);
    }
}
