import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SeriesApiService } from '../../../core/services/api/series-api.service';
import { combineLatest, Observable, timer } from 'rxjs';
import { SeriesDetailsS } from '../../../shared/models/series-details.interface';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { SeriesMetadata } from '../../../shared/models/series-metadata.interface';
import { SeriesTournament } from '../../models/combined-ranking.interface';
import { LeaderboardRow } from '../../models/overall-ranking.interface';
import { MathContent } from '../../../shared/models/math-content.interface';
import { SeriesService } from '../../../core/services/series.service';
import { SimpleStat } from '../../../shared/models/simple-stat.interface';
import { RankingService } from '../../../core/services/util/ranking.service';
import { AuthService, User } from '@auth0/auth0-angular';
import { FetchService } from '../../../core/services/fetch.service';

export interface SeriesHeader {
    logo: string;
    name: string;
    tournamentsPlayed: number;
    totalTournaments: number;
    percentageToFinalPot: number;
    maxAmountPerTournament: number;
    guaranteed: number;
    formulaMathContent: MathContent;
}

export interface SeriesStats {
    bestAverageRank: SimpleStat[];
    mostPrices: SimpleStat[];
    mostEffPrices: SimpleStat[];
    mostRebuysAddons: SimpleStat[];
    mostRebuysAddonsPerT: SimpleStat[];
    mostITM: SimpleStat[];
    mostPercITM: SimpleStat[];
    mostSpilled: SimpleStat[];
}

@Component({
    selector: 'app-series-page',
    templateUrl: './series-page.component.html',
    styleUrls: ['./series-page.component.scss']
})
export class SeriesPageComponent implements OnInit {

    user$: Observable<User | undefined | null>;
    myEmail$: Observable<string | undefined | null>;
    series$: Observable<SeriesDetailsS>;
    seriesHeader$: Observable<SeriesHeader>;
    leaderboard$: Observable<any>;
    seriesStats$: Observable<SeriesStats>;
    tournaments$: Observable<SeriesTournament[]>;

    seriesId: number;
    password: string;

    private route: ActivatedRoute = inject(ActivatedRoute);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private seriesService: SeriesService = inject(SeriesService);
    private rankingService: RankingService = inject(RankingService);
    private router: Router = inject(Router);
    private authService: AuthService = inject(AuthService);
    private fetchService: FetchService = inject(FetchService);

    ngOnInit(): void {
        this.seriesId = this.route.snapshot.params['sId'];
        this.password = this.route.snapshot.params['password'];

        this.user$ = this.authService.user$;

        this.myEmail$ = this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.email),
            tap((e) => console.log('email', e))
        );

        this.series$ = combineLatest([
            timer(0, 10000),
            this.fetchService.getFetchTrigger$()
        ]).pipe(
            switchMap(() => this.seriesApiService.getWithDetailsByPw2$(this.seriesId, this.password).pipe(
                tap((e) => {
                    if (Object.keys(e).length < 3) {
                        this.router.navigate(['not-found']);
                    }
                }),
                shareReplay(1)
            )));

        this.seriesHeader$ = this.series$.pipe(
            map((series: SeriesDetailsS) => ({
                    logo: series.branding.logo,
                    name: series.name,
                    tournamentsPlayed: series.tournaments.length,
                    totalTournaments: series.noOfTournaments,
                    percentageToFinalPot: series.percentage,
                    maxAmountPerTournament: series.maxAmountPerTournament,
                    guaranteed: this.seriesService.getGuaranteedFromSeries(series),
                    formulaMathContent: {
                        latex: this.rankingService.getFormulaDesc(series.rankFormula)
                    },
                })
            )
        );

        const metadata$ = this.seriesApiService.getSeriesMetadata$(this.seriesId, this.password).pipe(
            shareReplay(1)
        );

        this.tournaments$ = combineLatest([
            this.series$,
            metadata$
        ]).pipe(
            map(([series, metadata]: [SeriesDetailsS, SeriesMetadata]) =>
                this.seriesService.calculateSeriesTournaments(series, metadata)
            )
        );

        this.leaderboard$ = this.tournaments$.pipe(
            map((tournaments: SeriesTournament[]) => this.seriesService.merge(tournaments)),
            map((ranking: LeaderboardRow[]) => ranking.sort(
                (a: LeaderboardRow, b: LeaderboardRow) => b.points - a.points || a.rebuysAddons - b.rebuysAddons
            )),
        );

        this.seriesStats$ = this.leaderboard$.pipe(
            map((leaderboard: LeaderboardRow[]) => this.seriesService.calcSeriesStats(leaderboard)),
        );

        this.fetchService.trigger();
    }

}
