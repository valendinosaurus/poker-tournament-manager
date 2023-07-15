import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Location } from '../../../shared/models/location.interface';

@Injectable({
    providedIn: 'root'
})
export class LocationApiService {

    private readonly ENDPOINT = 'location';

    constructor(
        private http: HttpClient
    ) {
    }

    getAll$(): Observable<Location[]> {
        return this.http.get<Location[]>(`${BACKEND_URL}${this.ENDPOINT}`);
    }

    get$(id: number): Observable<Location> {
        return this.http.get<Location>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }

    post$(location: Location): Observable<any> {
        return this.http.post<any>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(location)
        );
    }

    put$(location: Location): Observable<any> {
        return this.http.put<any>(`${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(location)
        );
    }

    delete$(id: number): Observable<any> {
        return this.http.delete(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }
}
