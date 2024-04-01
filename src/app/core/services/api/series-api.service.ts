import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { AdminTournament } from '../../../shared/models/tournament.interface';
import { map, switchMap } from 'rxjs/operators';
import { Series, SeriesS, SeriesModel } from '../../../shared/models/series.interface';
import { AuthService, User } from '@auth0/auth0-angular';
import { SeriesMetadata } from '../../../shared/models/series.interface';
import { ServerResponse } from '../../../shared/models/server-response';

@Injectable({
    providedIn: 'root'
})
export class SeriesApiService {

    private readonly ENDPOINT = 'series';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
    }

    getForAdmin$(sub: string): Observable<AdminTournament[]> {
        return this.http.get<AdminTournament[]>(`${BACKEND_URL}${this.ENDPOINT}/admin/${sub}`).pipe();
    }

    getWithDetailsByPw$(id: number, password: string): Observable<SeriesS> {
        return this.http.get<SeriesS>(`${BACKEND_URL}${this.ENDPOINT}/details/pw/${id}/${password}`);
    }

    getSeriesMetadata$(id: number, password: string): Observable<SeriesMetadata> {
        return this.http.get<SeriesMetadata>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${password}/meta`);
    }

    get$(id: number, sub: string): Observable<Series> {
        return this.http.get<Series>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`);
    }

    post$(series: SeriesModel): Observable<ServerResponse> {
        return this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.http.post<ServerResponse>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...series,
                    sub
                })
            ))
        );
    }

    put$(series: SeriesModel): Observable<ServerResponse> {
        return this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.http.put<ServerResponse>(`${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...series,
                    sub
                })
            ))
        );
    }

    delete$(id: number, sub: string): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`);
    }

    addTournament$(tournamentId: number, seriesId: number): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/add-tournament`,
            JSON.stringify({
                sId: seriesId,
                tId: tournamentId
            })
        );
    }

    removeTournament$(tournamentId: number, seriesId: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${seriesId}/tournament/${tournamentId}`);
    }
}
