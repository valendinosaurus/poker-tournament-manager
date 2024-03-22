import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Series } from '../../../shared/models/series.interface';
import { Tournament } from '../../../shared/models/tournament.interface';
import { Branding } from '../../../shared/models/branding.interface';
import { map, switchMap } from 'rxjs/operators';
import { SeriesDetails } from '../../../shared/models/series-details.interface';
import { AuthService, User } from '@auth0/auth0-angular';
import { SeriesMetadata } from '../../../shared/models/series-metadata.interface';
import { SeriesModel } from '../../../shared/models/series-model.interface';
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

    getAll$(sub: string): Observable<Series[]> {
        return this.http.get<Series[]>(`${BACKEND_URL}${this.ENDPOINT}/${sub}`);
    }

    getAllWithDetails$(sub: string): Observable<SeriesDetails[]> {
        return this.http.get<SeriesDetails[]>(`${BACKEND_URL}${this.ENDPOINT}/details/${sub}`).pipe(
            map(tournaments => tournaments.map(
                t => {
                    return {
                        ...t,
                        branding: this.mapBranding(t.branding),
                        tournaments: this.mapTournaments(t.tournaments)
                    };
                }
            ))
        );
    }

    getWithDetailsByPw$(id: number, password: string): Observable<SeriesDetails | null> {
        return this.http.get<SeriesDetails | null>(`${BACKEND_URL}${this.ENDPOINT}/details/pw/${id}/${password}`).pipe(
            map((t: SeriesDetails | null) => t ? ({
                    ...t,
                    branding: this.mapBranding(t.branding),
                    tournaments: this.mapTournaments(t.tournaments)
                }) : null
            )
        );
    }

    getSeriesMetadata$(id: number, password: string): Observable<SeriesMetadata> {
        return this.http.get<SeriesMetadata>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${password}/meta`);
    }

    private mapTournaments(tournamentsString: any): Tournament[] {
        if (tournamentsString) {
            const tournamentsRaw: string = (tournamentsString ?? '').toString() as string;
            const split1 = tournamentsRaw.split(';');
            const tournaments: Tournament[] = [];

            split1.forEach(s1 => {
                const split2 = s1.split(',');

                tournaments.push({
                    id: +split2[0],
                    date: new Date(split2[1]),
                    name: split2[2],
                    players: [],
                    entries: [],
                    structure: [],
                    eliminations: [],
                    initialPricePool: 0,
                    payout: 0,
                    location: 0,
                    addonStack: 0,
                    addonAmount: 0,
                    noOfReEntries: 0,
                    rebuyAmount: 0,
                    startStack: 0,
                    buyInAmount: 0,
                    maxPlayers: 0,
                    finishes: [],
                    noOfRebuys: 0,
                    rebuyStack: 0,
                    withReEntry: false,
                    withRebuy: false,
                    withAddon: false,
                    rankFormula: 0
                });
            });

            return tournaments;
        }

        return [];
    }

    private mapBranding(brandingString: any): Branding {
        if (brandingString) {
            const brandingRaw: string = (brandingString ?? '').toString() as string;
            const split1 = brandingRaw.split(',');

            return {
                id: +split1[0],
                name: split1[1],
                description: split1[2],
                logo: split1[3]
            };
        }

        return {
            id: 0,
            logo: '',
            name: '',
            description: ''
        };
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

    put$(series: Series): Observable<ServerResponse> {
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
