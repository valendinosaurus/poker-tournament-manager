import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Tournament } from '../../../shared/models/tournament.interface';
import { Player } from '../../../shared/models/player.interface';
import { BlindLevel } from '../../../shared/models/blind-level.interface';
import { TournamentDetails } from '../../../shared/models/tournament-details.interface';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class TournamentApiService {

    private readonly ENDPOINT = 'tournament';

    constructor(
        private http: HttpClient
    ) {
    }

    getAll$(): Observable<Tournament[]> {
        return this.http.get<Tournament[]>(`${BACKEND_URL}${this.ENDPOINT}`);
    }

    getAllWithoutSeries$(): Observable<{ label: string, value: number }[]> {
        return this.http.get<{ label: string, value: number }[]>(`${BACKEND_URL}${this.ENDPOINT}/no-series`);
    }

    getAllWithDetails$(): Observable<TournamentDetails[]> {
        return this.http.get<TournamentDetails[]>(`${BACKEND_URL}${this.ENDPOINT}/details`).pipe(
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
                    id: +split2[7]
                });
            });

            return blinds;
        }

        return [];
    }

    get$(id: number): Observable<Tournament> {
        return this.http.get<Tournament>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }

    getFormula$(id: number): Observable<{ rankFormula: number }> {
        return this.http.get<{ rankFormula: number }>(`${BACKEND_URL}${this.ENDPOINT}/${id}/formula`);
    }

    post$(tournament: Tournament): Observable<any> {
        return this.http.post<any>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(tournament)
        );
    }

    put$(tournament: Tournament): Observable<any> {
        return this.http.put<any>(`${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(tournament)
        );
    }

    delete$(id: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }

    addPlayer$(playerId: number, tournamentId: number): Observable<any> {
        return this.http.post<any>(
            `${BACKEND_URL}${this.ENDPOINT}/add-player`,
            JSON.stringify({
                tId: tournamentId,
                pId: playerId
            })
        );
    }

    addPlayers$(playerId: number[], tournamentId: number): Observable<any> {
        return this.http.post<any>(
            `${BACKEND_URL}${this.ENDPOINT}/add-players`,
            JSON.stringify({
                tId: tournamentId,
                pIds: playerId
            })
        );
    }

    removePlayer$(playerId: number, tournamentId: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${tournamentId}/player/${playerId}`);
    }

    addBlind$(blindId: number, tournamentId: number, position: number): Observable<any> {
        return this.http.post<any>(
            `${BACKEND_URL}${this.ENDPOINT}/add-blind`,
            JSON.stringify({
                tId: tournamentId,
                bId: blindId,
                position
            })
        );
    }

    addBlinds$(blindId: number[], tournamentId: number, position: number): Observable<any> {
        return this.http.post<any>(
            `${BACKEND_URL}${this.ENDPOINT}/add-blinds`,
            JSON.stringify({
                tId: tournamentId,
                bIds: blindId,
                position
            })
        );
    }

    removeBlind$(blindId: number, tournamentId: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${tournamentId}/blind/${blindId}`);
    }
}
