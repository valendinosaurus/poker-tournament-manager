import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { switchMap } from 'rxjs/operators';
import { Series, SeriesMetadata, SeriesModel, SeriesS } from '../../../shared/interfaces/series.interface';
import { ServerResponse } from '../../../shared/interfaces/server-response';
import { AdminSeries } from '../../../shared/interfaces/admin-series.interface';
import { AuthUtilService } from '../auth-util.service';
import { Player } from '../../../shared/interfaces/player.interface';

@Injectable({
    providedIn: 'root'
})
export class SeriesApiService {

    private readonly ENDPOINT = 'series';

    private http: HttpClient = inject(HttpClient);
    private authUtilService: AuthUtilService = inject(AuthUtilService);

    getForAdmin$(): Observable<AdminSeries[]> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<AdminSeries[]>(
                `${BACKEND_URL}${this.ENDPOINT}/admin/${sub}`
            ))
        );
    }

    getWithDetailsByPw$(id: number, password: string): Observable<SeriesS> {
        return this.http.get<SeriesS>(`${BACKEND_URL}${this.ENDPOINT}/details/pw/${id}/${password}`);
    }

    getSeriesMetadata$(id: number, password: string): Observable<SeriesMetadata> {
        return this.http.get<SeriesMetadata>(`${BACKEND_URL}${this.ENDPOINT}/meta/pw/${id}/${password}`);
    }

    get$(id: number): Observable<Series> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<Series>(
                `${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`
            ))
        );
    }

    post$(series: SeriesModel): Observable<ServerResponse> {
        return this.authUtilService.getSub$().pipe(
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
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.put<ServerResponse>(`${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...series,
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

    getDisqualifiedPlayers$(seriesId: number): Observable<Player[]> {
        return this.http.get<Player[]>(`${BACKEND_URL}${this.ENDPOINT}-disqualified/${seriesId}`);
    }

    disqualifyPlayer(seriesId: number, playerId: number): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/disqualify`,
            JSON.stringify({
                sId: seriesId,
                pId: playerId
            })
        );
    }

    removeDisqualifiedPlayer(seriesId: number, playerId: number): Observable<ServerResponse> {
        return this.http.delete<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/${seriesId}/disqualify/${playerId}`
        );
    }

}
