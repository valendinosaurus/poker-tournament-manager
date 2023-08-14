import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Player } from '../../../shared/models/player.interface';
import { BACKEND_URL } from '../../../app.const';
import { AuthService, User } from '@auth0/auth0-angular';
import { map, switchMap } from 'rxjs/operators';
import { PlayerModel } from '../../../shared/models/player-model.interface';
import { PlayerInSeries } from '../../../shared/models/player-in-series.interface';

@Injectable({
    providedIn: 'root'
})
export class PlayerApiService {

    private readonly ENDPOINT = 'player';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
    }

    getAll$(sub: string): Observable<Player[]> {
        return this.http.get<Player[]>(`${BACKEND_URL}${this.ENDPOINT}/${sub}`);
    }

    get$(id: number, sub: string): Observable<Player> {
        return this.http.get<Player>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`);
    }

    getInTournament$(tId: number, sub: string): Observable<Player[]> {
        return this.http.get<Player[]>(`${BACKEND_URL}${this.ENDPOINT}/tournament/${tId}/${sub}`);
    }

    getInSeries$(sId: number, password: string): Observable<PlayerInSeries[]> {
        return this.http.get<PlayerInSeries[]>(`${BACKEND_URL}${this.ENDPOINT}/series/${sId}/${password}`);
    }

    post$(player: PlayerModel): Observable<any> {
        return this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.http.post<any>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...player,
                    sub
                })
            ))
        );
    }

    put$(player: Player): Observable<any> {
        return this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.http.put<any>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...player,
                    sub
                })
            ))
        );
    }

    delete$(id: number, sub: string): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`);
    }
}
