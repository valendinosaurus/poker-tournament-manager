import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Player, PlayerModel } from '../../../shared/models/player.interface';
import { BACKEND_URL } from '../../../app.const';
import { switchMap } from 'rxjs/operators';
import { ServerResponse } from '../../../shared/models/server-response';
import { AuthUtilService } from '../auth-util.service';

@Injectable({
    providedIn: 'root'
})
export class PlayerApiService {

    private readonly ENDPOINT = 'player';

    private http: HttpClient = inject(HttpClient);
    private authUtilService: AuthUtilService = inject(AuthUtilService);

    getAll$(): Observable<Player[]> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<Player[]>(
                `${BACKEND_URL}${this.ENDPOINT}/${sub}`
            ))
        );
    }

    get$(id: number): Observable<Player> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<Player>(
                `${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`
            ))
        );
    }

    post$(player: PlayerModel): Observable<ServerResponse> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.post<ServerResponse>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...player,
                    sub
                })
            ))
        );
    }

    put$(player: Player): Observable<ServerResponse> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.put<ServerResponse>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...player,
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
}
