import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Location } from '../../../shared/models/location.interface';
import { AuthService, User } from '@auth0/auth0-angular';
import { map, switchMap } from 'rxjs/operators';
import { LocationModel } from '../../../shared/models/location-model.interface';
import { ServerResponse } from '../../../shared/models/server-response';

@Injectable({
    providedIn: 'root'
})
export class LocationApiService {

    private readonly ENDPOINT = 'location';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
    }

    getAll$(sub: string): Observable<Location[]> {
        return this.http.get<Location[]>(`${BACKEND_URL}${this.ENDPOINT}/${sub}`);
    }

    get$(id: number, sub: string): Observable<Location> {
        return this.http.get<Location>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`);
    }

    post$(location: LocationModel): Observable<ServerResponse> {
        return this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.http.post<ServerResponse>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...location,
                    sub
                })
            ))
        );
    }

    put$(location: Location): Observable<ServerResponse> {
        return this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.http.put<ServerResponse>(`${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...location,
                    sub
                })
            ))
        );
    }

    delete$(id: number, sub: string): Observable<any> {
        return this.http.delete(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`);
    }
}
