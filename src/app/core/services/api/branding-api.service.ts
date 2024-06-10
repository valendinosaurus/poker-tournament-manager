import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Branding, BrandingModel } from '../../../shared/interfaces/branding.interface';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';
import { ServerResponse } from '../../../shared/interfaces/server-response';
import { AuthUtilService } from '../auth-util.service';

@Injectable({
    providedIn: 'root'
})
export class BrandingApiService {

    private readonly ENDPOINT = 'branding';

    private http: HttpClient = inject(HttpClient);
    private authUtilService: AuthUtilService = inject(AuthUtilService);

    getAll$(): Observable<Branding[]> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<Branding[]>(
                `${BACKEND_URL}${this.ENDPOINT}/${sub}`
            ))
        );
    }

    get$(id: number): Observable<Branding> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<Branding>(
                `${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`
            ))
        );
    }

    post$(branding: BrandingModel): Observable<ServerResponse> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.post<ServerResponse>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...branding,
                    sub
                })
            ))
        );
    }

    put$(branding: BrandingModel): Observable<ServerResponse> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.put<ServerResponse>(`${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...branding,
                    sub
                })
            ))
        );
    }

    delete$(id: number): Observable<any> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.delete<any>(
                `${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`
            ))
        );
    }
}
