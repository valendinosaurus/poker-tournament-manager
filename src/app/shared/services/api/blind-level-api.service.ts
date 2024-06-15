import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { BlindLevel, BlindLevelModel } from '../../interfaces/blind-level.interface';
import { switchMap } from 'rxjs/operators';
import { ServerResponseType } from '../../types/server-response.type';
import { AuthUtilService } from '../auth-util.service';

@Injectable({
    providedIn: 'root'
})
export class BlindLevelApiService {

    private readonly ENDPOINT = 'blind-level';

    private http: HttpClient = inject(HttpClient);
    private authUtilService: AuthUtilService = inject(AuthUtilService);

    getAll$(): Observable<BlindLevel[]> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<BlindLevel[]>(
                `${BACKEND_URL}${this.ENDPOINT}/${sub}`
            ))
        );
    }

    get$(id: number): Observable<BlindLevel> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<BlindLevel>(
                `${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`
            ))
        );
    }

    post$(blindLevel: BlindLevelModel): Observable<ServerResponseType> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.post<ServerResponseType>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...blindLevel,
                    sub
                })
            ))
        );
    }

    put$(blindLevel: BlindLevelModel): Observable<ServerResponseType> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.put<ServerResponseType>(`${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...blindLevel,
                    sub
                })
            ))
        );
    }

    delete$(id: number, sub: string): Observable<ServerResponseType> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.delete<ServerResponseType>(
                `${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`
            ))
        );
    }
}
