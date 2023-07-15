import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Series } from '../../../shared/models/series.interface';
import { Tournament } from '../../../shared/models/tournament.interface';
import { Branding } from '../../../shared/models/branding.interface';
import { map } from 'rxjs/operators';
import { SeriesDetails } from '../../../shared/models/series-details.interface';

@Injectable({
    providedIn: 'root'
})
export class SeriesApiService {

    private readonly ENDPOINT = 'series';

    constructor(
        private http: HttpClient
    ) {
    }

    getAll$(): Observable<Series[]> {
        return this.http.get<Series[]>(`${BACKEND_URL}${this.ENDPOINT}`);
    }

    getAllWithDetails$(): Observable<SeriesDetails[]> {
        return this.http.get<SeriesDetails[]>(`${BACKEND_URL}${this.ENDPOINT}/details`).pipe(
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

    private mapTournaments(tournamentsString: any): Tournament[] {
        if (tournamentsString) {
            const tournamentsRaw: string = (tournamentsString ?? '').toString() as string;
            const split1 = tournamentsRaw.split(';');
            const tournamnets: Tournament[] = [];

            split1.forEach(s1 => {
                const split2 = s1.split(',');

                tournamnets.push({
                    id: undefined,
                    date: new Date(split2[0]),
                    name: split2[1],
                    players: [],
                    entries: [],
                    structure: [],
                    initialPricepool: 0,
                    payout: '',
                    location: 0,
                    addonAmount: 0,
                    addon: 0,
                    rebuy: 0,
                    startStack: 0,
                    buyIn: 0,
                    noOfTables: 0,
                    maxPlayers: 0,
                    finishes: [],
                    noOfRebuys: 0
                });
            });

            return tournamnets;
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

    get$(id: number): Observable<Series> {
        return this.http.get<Series>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }

    post$(series: Series): Observable<any> {
        return this.http.post<any>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(series)
        );
    }

    put$(series: Series): Observable<any> {
        return this.http.put<any>(`${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(series)
        );
    }

    delete$(id: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }

    addTournament$(tournamentId: number, seriesId: number): Observable<any> {
        return this.http.post<any>(
            `${BACKEND_URL}${this.ENDPOINT}/add-tournament`,
            JSON.stringify({
                sId: seriesId,
                tId: tournamentId
            })
        );
    }

    removeTournament$(tournament: Tournament, series: Series): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${tournament.id}/tournament/${tournament.id}`);
    }
}
