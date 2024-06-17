import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { AdminTournament, Tournament, TournamentModel } from '../../interfaces/tournament.interface';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { SeriesMetadata } from '../../interfaces/series.interface';
import { LocalTournamentSettings } from '../../interfaces/local-tournament-settings.interface';
import { Router } from '@angular/router';
import { ServerResponseType } from '../../types/server-response.type';
import { AuthUtilService } from '../auth-util.service';
import { TEvent } from '../../interfaces/t-event.interface';
import { TableDraw } from '../../interfaces/table-draw.interface';
import { TournamentSettings } from '../../interfaces/tournament-settings.interface';

@Injectable({
    providedIn: 'root'
})
export class TournamentApiService {

    private readonly ENDPOINT = 'tournament';

    private http: HttpClient = inject(HttpClient);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private router: Router = inject(Router);

    getAllWithoutSeries$(): Observable<{ label: string, value: number }[]> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<{ label: string, value: number }[]>(
                `${BACKEND_URL}${this.ENDPOINT}/no-series/${sub}`
            ))
        );
    }

    getForAdmin$(): Observable<AdminTournament[]> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<AdminTournament[]>(
                `${BACKEND_URL}${this.ENDPOINT}/admin/${sub}`
            ))
        );
    }

    get$(id: number): Observable<Tournament> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<Tournament | null>(
                `${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`
            ).pipe(
                tap((res: Tournament | null) => {
                    if (res === null) {
                        this.router.navigate(['/home']);
                    }
                }),
                filter((res: Tournament | null): res is Tournament => res !== null),
                map((res: Tournament) => ({
                    ...res,
                    adaptedPayout: res.adaptedPayout?.toString().split(',').map(e => +e) ?? undefined
                })),
            ))
        );
    }

    getLiveTickerByPassword(id: number, password: string): Observable<TEvent[]> {
        return this.http.get<TEvent[]>(
            `${BACKEND_URL}${this.ENDPOINT}/${id}/${password}/live-ticker`
        );
    }

    getSeriesMetadata$(id: number): Observable<SeriesMetadata> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<SeriesMetadata>(
                `${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}/meta`
            )),
        );
    }

    post$(tournament: TournamentModel): Observable<ServerResponseType> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.post<ServerResponseType>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...tournament,
                    sub
                })
            ))
        );
    }

    put$(tournament: TournamentModel): Observable<ServerResponseType> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.put<ServerResponseType>(`${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...tournament,
                    sub
                })
            ))
        );
    }

    putLocalTournamentSettings$(settings: LocalTournamentSettings): Observable<ServerResponseType> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.put<ServerResponseType>(`${BACKEND_URL}${this.ENDPOINT}/settings`,
                JSON.stringify({
                    ...settings,
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

    addPlayer$(playerId: number, tournamentId: number): Observable<ServerResponseType> {
        return this.http.post<ServerResponseType>(
            `${BACKEND_URL}${this.ENDPOINT}/add-player`,
            JSON.stringify({
                tId: tournamentId,
                pId: playerId
            })
        );
    }

    addPlayers$(playerId: number[], tournamentId: number): Observable<ServerResponseType> {
        return this.http.post<ServerResponseType>(
            `${BACKEND_URL}${this.ENDPOINT}/add-players`,
            JSON.stringify({
                tId: tournamentId,
                pIds: playerId
            })
        );
    }

    removePlayer$(playerId: number, tournamentId: number): Observable<any> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.delete<any>(
                `${BACKEND_URL}${this.ENDPOINT}/${tournamentId}/player/${playerId}/${sub}`
            ))
        );
    }

    addBlinds$(blindId: number[], tournamentId: number, positions: number[]): Observable<ServerResponseType> {
        return this.http.post<ServerResponseType>(
            `${BACKEND_URL}${this.ENDPOINT}/add-blinds`,
            JSON.stringify({
                tId: tournamentId,
                bIds: blindId,
                positions
            })
        );
    }

    addPause$(blindId: number, tournamentId: number, position: number): Observable<ServerResponseType> {
        return this.http.post<ServerResponseType>(
            `${BACKEND_URL}${this.ENDPOINT}/add-pause`,
            JSON.stringify({
                tId: tournamentId,
                bId: blindId,
                position
            })
        );
    }

    removeBlind$(blindId: number, tournamentId: number): Observable<ServerResponseType> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.delete<ServerResponseType>(
                `${BACKEND_URL}${this.ENDPOINT}/${tournamentId}/blind/${blindId}/${sub}`
            ))
        );
    }

    removeAllBlinds$(tournamentId: number): Observable<ServerResponseType> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.delete<ServerResponseType>(
                `${BACKEND_URL}${this.ENDPOINT}/${tournamentId}/all-blinds/${sub}`
            ))
        );

    }

    copyTournament$(
        tournament: Tournament,
        newName: string,
        newDate: string,
        withPlayers: boolean,
        withStructure: boolean,
        asTest: boolean
    ): Observable<ServerResponseType> {
        return this.http.post<ServerResponseType>(
            `${BACKEND_URL}copy-tournament`,
            JSON.stringify({
                ...tournament,
                name: newName,
                date: newDate,
                withPlayers,
                withStructure,
                asTest,
                playerIds: withPlayers ? tournament.players.map(p => p.id) : [],
                blindIds: withStructure ? tournament.structure.map(b => b.id) : [],
                positions: withStructure ? tournament.structure.map(b => b.position) : []
            })
        );
    }

    addAdaptedPayout$(tId: number, payout: number[]): Observable<ServerResponseType> {
        return this.http.post<ServerResponseType>(
            `${BACKEND_URL}${this.ENDPOINT}/adapted-payout`,
            JSON.stringify({
                id: tId,
                payout: payout.join(',')
            })
        );
    }

    deleteAdaptedPayout$(tId: number): Observable<ServerResponseType> {
        return this.http.delete<ServerResponseType>(`${BACKEND_URL}${this.ENDPOINT}/${tId}/adapted-payout`);
    }

    getTableDraw$(tId: number): Observable<TableDraw | null> {
        return this.http.get<{ tableDraw: string } | null>(`${BACKEND_URL}${this.ENDPOINT}-draw/${tId}`).pipe(
            map((res: { tableDraw: string } | null) => res
                ? JSON.parse(res.tableDraw) as TableDraw
                : null
            )
        );
    }

    postTableDraw$(tableDraw: TableDraw): Observable<ServerResponseType> {
        return this.http.post<ServerResponseType>(
            `${BACKEND_URL}${this.ENDPOINT}-draw`,
            JSON.stringify({
                tId: tableDraw.tournament.id,
                tableDraw: JSON.stringify(tableDraw)
            })
        );
    }

    deleteTableDraw$(tId: number): Observable<ServerResponseType> {
        return this.http.delete<ServerResponseType>(`${BACKEND_URL}${this.ENDPOINT}-draw/${tId}`);
    }

    putTournamentSettings$(settings: TournamentSettings): Observable<ServerResponseType> {
        return this.http.put<ServerResponseType>(
            `${BACKEND_URL}${this.ENDPOINT}-settings`,
            JSON.stringify(settings)
        );
    }

    deleteTournamentSettings$(tId: number): Observable<ServerResponseType> {
        return this.http.delete<ServerResponseType>(`${BACKEND_URL}${this.ENDPOINT}-settings/${tId}`);
    }

}
