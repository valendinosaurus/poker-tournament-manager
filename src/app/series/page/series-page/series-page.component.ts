import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SeriesApiService } from '../../../core/services/api/series-api.service';
import { combineLatest, Observable, timer } from 'rxjs';
import { SeriesDetails, SeriesDetailsS } from '../../../shared/models/series-details.interface';
import { Entry } from '../../../shared/models/entry.interface';
import { Finish } from '../../../shared/models/finish.interface';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { SeriesMetadata } from '../../../shared/models/series-metadata.interface';
import { TournamentInSeries } from '../../../shared/models/tournament-in-series.interface';
import { PlayerInSeries } from '../../../shared/models/player-in-series.interface';
import { CombinedEntriesFinishes } from '../../models/combined-entries-finishes.interface';
import { CombinedRanking } from '../../models/combined-ranking.interface';
import { OverallRanking } from '../../models/overall-ranking.interface';
import { MathContent } from '../../../shared/models/math-content.interface';
import { SeriesService } from '../../../core/services/series.service';
import { SimpleStat } from '../../../shared/models/simple-stat.interface';
import { Tournament } from '../../../shared/models/tournament.interface';

@Component({
    selector: 'app-series-page',
    templateUrl: './series-page.component.html',
    styleUrls: ['./series-page.component.scss']
})
export class SeriesPageComponent implements OnInit {

    private route: ActivatedRoute = inject(ActivatedRoute);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private seriesService: SeriesService = inject(SeriesService);

    series$: Observable<SeriesDetailsS>;
    combined$: Observable<CombinedEntriesFinishes[]>;
    combinedRankings$: Observable<CombinedRanking[]>;
    overallRanking$: Observable<OverallRanking[]>;

    bestAverageRank: SimpleStat[];
    mostPrices: SimpleStat[];
    mostEffPrices: SimpleStat[];
    mostRebuysAddons: SimpleStat[];
    mostRebuysAddonsPerT: SimpleStat[];
    mostITM: SimpleStat[];
    mostPercITM: SimpleStat[];

    mostSpilled: SimpleStat[] = [
        {
            image: 'https://c8.alamy.com/compde/gc2ebk/ufo-verteiler-lkw-weissbier-in-boston-street-gc2ebk.jpg',
            played: 3,
            value: 3,
            playerName: 'Leon'
        },
        {
            image: 'https://media.wired.com/photos/5af36b4a65806b269bfe8e44/master/w_2560%2Cc_limit/marijuana-522464999.jpg',
            played: 4,
            value: 3,
            playerName: 'Päscu'
        },
        {
            image: 'https://c8.alamy.com/compde/gc2ebk/ufo-verteiler-lkw-weissbier-in-boston-street-gc2ebk.jpg',
            played: 3,
            value: 1,
            playerName: 'Maki'
        },
        {
            image: 'https://media.wired.com/photos/5af36b4a65806b269bfe8e44/master/w_2560%2Cc_limit/marijuana-522464999.jpg',
            played: 5,
            value: 1,
            playerName: 'Valentino'
        }
    ];

    seriesId: number;
    password: string;
    formulaString: MathContent;
    guaranteed: number;

    ngOnInit(): void {
        this.seriesId = this.route.snapshot.params['sId'];
        this.password = this.route.snapshot.params['password'];

        const base$ = timer(0, 10000);

        this.series$ = timer(0, 10000).pipe(
            switchMap(() => this.seriesApiService.getWithDetailsByPw2$(this.seriesId, this.password).pipe(
                shareReplay(1)
            )));

        const finishes$: Observable<Finish[]> = this.series$.pipe(
            map((series: SeriesDetailsS) => series.tournaments),
            map((tournaments: Tournament[]) => tournaments.map(t => t.finishes)),
            map((finishesDeep: Finish[][]) => finishesDeep.reduce((acc, val) => acc.concat(val), [])),
            shareReplay(1)
        );

        const entries$: Observable<Entry[]> = this.series$.pipe(
            map((series: SeriesDetailsS) => series.tournaments),
            map((tournaments: Tournament[]) => tournaments.map(t => t.entries)),
            map((entriesDeep: Entry[][]) => entriesDeep.reduce((acc, val) => acc.concat(val), [])),
            shareReplay(1)
        );

        const players$: Observable<PlayerInSeries[]> = this.series$.pipe(
            map((series: SeriesDetailsS) => series.tournaments),
            map((tournaments: Tournament[]) => tournaments.map(t => t.players as PlayerInSeries[])),
            map((playersDeep: PlayerInSeries[][]) => playersDeep.reduce((acc, val) => acc.concat(val), [])),
            shareReplay(1)
        );

        const tournaments$: Observable<TournamentInSeries[]> = this.series$.pipe(
            map((series: SeriesDetailsS) => series.tournaments),
            shareReplay(1)
        );

        const metadata$ = this.seriesApiService.getSeriesMetadata$(this.seriesId, this.password).pipe(
            shareReplay(1)
        );

        this.combined$ = combineLatest([
            finishes$,
            entries$,
            players$,
            tournaments$,
            metadata$
        ]).pipe(
            map(([finishes, entries, players, tournaments, seriesMetadata]: [Finish[], Entry[], PlayerInSeries[], TournamentInSeries[], SeriesMetadata]) =>
                this.seriesService.calculateRankings(
                    finishes,
                    entries,
                    players,
                    tournaments,
                    seriesMetadata
                )[0]
            )
        );

        this.combinedRankings$ = combineLatest([
            finishes$,
            entries$,
            players$,
            tournaments$,
            metadata$
        ]).pipe(
            map(([finishes, entries, players, tournaments, seriesMetadata]: [Finish[], Entry[], PlayerInSeries[], TournamentInSeries[], SeriesMetadata]) =>
                this.seriesService.calculateRankings(
                    finishes,
                    entries,
                    players,
                    tournaments,
                    seriesMetadata
                )[1]
            ),
            tap((c) => this.guaranteed = this.seriesService.getGuaranteed(c))
        );

        this.overallRanking$ = this.combinedRankings$.pipe(
            map((combinedRanking: CombinedRanking[]) => this.seriesService.merge(combinedRanking)),
            map((ranking: OverallRanking[]) => ranking.sort(
                (a: OverallRanking, b: OverallRanking) => b.points - a.points || a.rebuysAddons - b.rebuysAddons
            )),
            tap((or) => this.calcStats2(or)),
            shareReplay(1)
        );
    }

    calcStats2(overallRanking: OverallRanking[]): void {
        this.bestAverageRank = this.seriesService.getBestAverageRank(overallRanking);
        this.mostPrices = this.seriesService.getMostPrices([...overallRanking]);
        this.mostEffPrices = this.seriesService.getMostEffectivePrices([...overallRanking]);
        this.mostRebuysAddons = this.seriesService.getMostRebuysAddons([...overallRanking]);
        this.mostRebuysAddonsPerT = this.seriesService.getMostRebuysAddonsPerTournament([...overallRanking]);
        this.mostITM = this.seriesService.getMostITM([...overallRanking]);
        this.mostPercITM = this.seriesService.getMostPercentualITM([...overallRanking]);
    }
}
