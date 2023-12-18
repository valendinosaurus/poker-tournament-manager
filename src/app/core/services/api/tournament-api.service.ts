import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Tournament } from '../../../shared/models/tournament.interface';
import { Player } from '../../../shared/models/player.interface';
import { BlindLevel } from '../../../shared/models/blind-level.interface';
import { TournamentDetails } from '../../../shared/models/tournament-details.interface';
import { map, switchMap } from 'rxjs/operators';
import { SeriesMetadata } from '../../../shared/models/series-metadata.interface';
import { AuthService, User } from '@auth0/auth0-angular';
import { TournamentInSeries } from '../../../shared/models/tournament-in-series.interface';
import { TournamentModel } from '../../../shared/models/tournament-model.interface';
import { ServerResponse } from '../../../shared/models/server-response';
import { TournamentSettings } from '../../../shared/models/tournament-settings.interface';

@Injectable({
    providedIn: 'root'
})
export class TournamentApiService {

    private readonly ENDPOINT = 'tournament';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
    }

    getAll$(sub: string): Observable<Tournament[]> {
        return this.http.get<Tournament[]>(`${BACKEND_URL}${this.ENDPOINT}/${sub}`);
    }

    getAllWithoutSeries$(sub: string): Observable<{ label: string, value: number }[]> {
        return this.http.get<{ label: string, value: number }[]>(`${BACKEND_URL}${this.ENDPOINT}/no-series/${sub}`);
    }

    getAllWithDetails$(sub: string): Observable<TournamentDetails[]> {
        return this.http.get<TournamentDetails[]>(`${BACKEND_URL}${this.ENDPOINT}/details/${sub}`).pipe(
            map(tournaments => tournaments.map(
                t => {
                    return {
                        ...t,
                        players: this.mapPlayers(t.players),
                        structure: this.mapBlinds(t.structure)
                    };
                }
            ))
        );
    }

    private mapPlayers(playersString: any): Player[] {
        if (playersString) {
            const playersRaw: string = (playersString ?? '').toString() as string;
            const split1 = playersRaw.split(';');
            const players: Player[] = [];

            split1.forEach(s1 => {
                const split2 = s1.split(',');

                players.push({
                    id: +split2[0],
                    name: split2[1],
                    image: split2[2]
                });
            });

            return players;
        }

        return [];
    }

    private mapBlinds(blindsString: any): BlindLevel[] {
        if (blindsString) {
            const blindsRaw: string = blindsString.toString() as string;
            const split1 = blindsRaw.split(';');
            const blinds: BlindLevel[] = [];

            split1.forEach(s1 => {
                const split2 = s1.split(',');

                blinds.push({
                    sb: +split2[0],
                    bb: +split2[1],
                    ante: +split2[2],
                    btnAnte: +split2[3],
                    duration: +split2[4],
                    isPause: +split2[5] === 1,
                    isChipUp: +split2[6] === 1,
                    endsRebuy: +split2[8] === 1, // TODO
                    id: +split2[7],
                    position: +split2[9]
                });
            });

            return blinds.sort(
                (a, b) => (a.position) - (b.position)
            );
        }

        return [];
    }

    get$(id: number, sub: string): Observable<Tournament> {
        return this.http.get<Tournament>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`);
    }

    getInSeries$(sId: number, password: string): Observable<TournamentInSeries[]> {
        return this.http.get<TournamentInSeries[]>(`${BACKEND_URL}${this.ENDPOINT}/series/${sId}/${password}`);
    }

    getFormula$(id: number, sub: string): Observable<{ rankFormula: number }> {
        return this.http.get<{ rankFormula: number }>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}/formula`);
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

    put$(tournament: Tournament): Observable<ServerResponse> {
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
