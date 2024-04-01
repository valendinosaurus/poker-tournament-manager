import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { AdminTournament, Tournament, TournamentModel } from '../../../shared/models/tournament.interface';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { SeriesMetadata } from '../../../shared/models/series.interface';
import { AuthService, User } from '@auth0/auth0-angular';
import { ServerResponse } from '../../../shared/models/server-response';
import { TournamentSettings } from '../../../shared/models/tournament-settings.interface';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class TournamentApiService {

    private readonly ENDPOINT = 'tournament';

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private router: Router
    ) {
    }

    getAllWithoutSeries$(sub: string): Observable<{ label: string, value: number }[]> {
        return this.http.get<{ label: string, value: number }[]>(`${BACKEND_URL}${this.ENDPOINT}/no-series/${sub}`);
    }

    getForAdmin$(sub: string): Observable<AdminTournament[]> {
        return this.http.get<AdminTournament[]>(`${BACKEND_URL}${this.ENDPOINT}/admin/${sub}`).pipe();
    }

    get$(id: number, sub: string): Observable<Tournament> {
        return this.http.get<Tournament | null>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`).pipe(
            tap((res: Tournament | null) => {
                if (res === null) {
                    this.router.navigate(['/home']);
                }
            }),
            filter((res: Tournament | null): res is Tournament => res !== null)
        );
    }

    getSeriesMetadata$(id: number, sub: string): Observable<SeriesMetadata> {
        return this.http.get<SeriesMetadata>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}/meta`);
    }

    post$(tournament: TournamentModel): Observable<ServerResponse> {
        return this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.http.post<ServerResponse>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...tournament,
                    sub
                })
            ))
        );
    }

    put$(tournament: TournamentModel): Observable<ServerResponse> {
        return this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.http.put<ServerResponse>(`${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...tournament,
                    sub
                })
            ))
        );
    }

    putSettings$(settings: TournamentSettings): Observable<ServerResponse> {
        return this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.http.put<ServerResponse>(`${BACKEND_URL}${this.ENDPOINT}/settings`,
                JSON.stringify({
                    ...settings,
                    sub
                })
            ))
        );
    }

    delete$(id: number, sub: string): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`);
    }

    addPlayer$(playerId: number, tournamentId: number): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/add-player`,
            JSON.stringify({
                tId: tournamentId,
                pId: playerId
            })
        );
    }

    addPlayers$(playerId: number[], tournamentId: number): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/add-players`,
            JSON.stringify({
                tId: tournamentId,
                pIds: playerId
            })
        );
    }

    removePlayer$(playerId: number, tournamentId: number, sub: string): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${tournamentId}/player/${playerId}/${sub}`);
    }

    addBlind$(blindId: number, tournamentId: number, position: number): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/add-blind`,
            JSON.stringify({
                tId: tournamentId,
                bId: blindId,
                position
            })
        );
    }

    addBlinds$(blindId: number[], tournamentId: number, positions: number[]): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/add-blinds`,
            JSON.stringify({
                tId: tournamentId,
                bIds: blindId,
                positions
            })
        );
    }

    addPause$(blindId: number, tournamentId: number, position: number): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/add-pause`,
            JSON.stringify({
                tId: tournamentId,
                bId: blindId,
                position
            })
        );
    }

    removeBlind$(blindId: number, tournamentId: number, sub: string): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${tournamentId}/blind/${blindId}/${sub}`);
    }
}
