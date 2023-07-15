import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Branding } from '../../../shared/models/branding.interface';

@Injectable({
    providedIn: 'root'
})
export class BrandingApiService {

    private readonly ENDPOINT = 'branding';

    constructor(
        private http: HttpClient
    ) {
    }

    getAll$(): Observable<Branding[]> {
        return this.http.get<Branding[]>(`${BACKEND_URL}${this.ENDPOINT}`);
    }

    get$(id: number): Observable<Branding> {
        return this.http.get<Branding>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }

    post$(branding: Branding): Observable<any> {
        return this.http.post<any>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(branding)
        );
    }

    put$(branding: Branding): Observable<any> {
        return this.http.put<any>(`${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(branding)
        );
    }

    delete$(id: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }
}
