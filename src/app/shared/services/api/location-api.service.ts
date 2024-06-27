import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Location } from '../../interfaces/location.interface';
import { switchMap } from 'rxjs/operators';
import { ServerResponse } from '../../interfaces/server-response';
import { AuthUtilService } from '../auth-util.service';

@Injectable({
    providedIn: 'root'
})
export class LocationApiService {

    private readonly ENDPOINT = 'location';

    private http: HttpClient = inject(HttpClient);
    private authUtilService: AuthUtilService = inject(AuthUtilService);

    getAll$(): Observable<Location[]> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<Location[]>(
                `${BACKEND_URL}${this.ENDPOINT}/${sub}`
            ))
        );
    }

    get$(id: number): Observable<Location> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<Location>(
                `${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`
            ))
        );
    }

    post$(location: Location): Observable<ServerResponse> {
        return this.authUtilService.getSub$().pipe(
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
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.put<ServerResponse>(`${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...location,
                    sub
                })
            ))
        );
    }

    delete$(id: number): Observable<any> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.delete(
                `${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`
            ))
        );
    }
}
