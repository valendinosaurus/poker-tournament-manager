import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Player } from '../../../shared/models/player.interface';
import { BACKEND_URL } from '../../../app.const';

@Injectable({
    providedIn: 'root'
})
export class PlayerApiService {

    private readonly ENDPOINT = 'player';

    constructor(
        private http: HttpClient
    ) {
    }

    getAll$(): Observable<Player[]> {
        return this.http.get<Player[]>(`${BACKEND_URL}${this.ENDPOINT}`);
    }

    get$(id: number): Observable<Player> {
        return this.http.get<Player>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }

    getInTournament$(tId: number): Observable<Player[]> {
        return this.http.get<Player[]>(`${BACKEND_URL}${this.ENDPOINT}/tournament/${tId}`);
    }

    post$(player: Player): Observable<any> {
        return this.http.post<any>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(player)
        );
    }

    put$(player: Player): Observable<any> {
        return this.http.put<any>(`${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(player)
        );
    }

    delete$(id: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }
}
