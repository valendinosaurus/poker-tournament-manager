import { Component, inject, OnInit, WritableSignal } from '@angular/core';
import { LeaderboardRow } from '../../../../../series/interfaces/overall-ranking.interface';
import { SeriesMetadata, SeriesS } from '../../../../../shared/interfaces/series.interface';
import { SeriesService } from '../../../../../shared/services/series.service';
import { combineLatest, Observable } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { SeriesTournament } from '../../../../../series/interfaces/series-tournament.interface';
import { SeriesApiService } from '../../../../../shared/services/api/series-api.service';
import { FetchService } from '../../../../../shared/services/fetch.service';
import { AsyncPipe } from '@angular/common';
import { LeaderboardComponent } from '../../../../../shared/components/leaderboard/leaderboard.component';
import { TimerStateService } from '../../../../services/timer-state.service';
import { NullsafePrimitivePipe } from '../../../../../shared/pipes/nullsafe-primitive.pipe';
import { fakeAsync } from '@angular/core/testing';
import { RankFormulaApiService } from '../../../../../shared/services/api/rank-formula-api.service';

@Component({
    selector: 'app-leaderboard-info',
    templateUrl: './leaderboard-info.component.html',
    styleUrls: ['./leaderboard-info.component.scss'],
    standalone: true,
    imports: [
        LeaderboardComponent,
        AsyncPipe,
        NullsafePrimitivePipe,
    ]
})
export class LeaderboardInfoComponent implements OnInit {

    metadata: WritableSignal<SeriesMetadata | undefined>;

    series$: Observable<SeriesS>;
    leaderboard$: Observable<any>;

    private seriesService: SeriesService = inject(SeriesService);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private fetchService: FetchService = inject(FetchService);
    private state: TimerStateService = inject(TimerStateService);
    private rankFormulaApiService: RankFormulaApiService = inject(RankFormulaApiService);

    ngOnInit(): void {
        this.metadata = this.state.metadata;

        const metadata = this.metadata();

        if (metadata) {

            const id = metadata.id;
            const pw = metadata.password;

            this.series$ = this.fetchService.getFetchTrigger$().pipe(
                switchMap(() => this.seriesApiService.getWithDetailsByPw$(id, pw)),
                shareReplay(1)
            );

            const metadata$ = this.seriesApiService.getSeriesMetadata$(
                metadata.id,
                metadata.password
            ).pipe(
                shareReplay(1)
            );

            const tournaments$ = combineLatest([
                this.series$,
                metadata$
            ]).pipe(
                map(([series, metadata]: [SeriesS, SeriesMetadata]) =>
                    this.seriesService.calculateSeriesTournaments(series, metadata)
                )
            );

            this.leaderboard$ = tournaments$.pipe(
                map((tournaments: SeriesTournament[]) => this.seriesService.merge(tournaments)),
                map((ranking: LeaderboardRow[]) => ranking.sort(
                    (a: LeaderboardRow, b: LeaderboardRow) => b.points - a.points || a.rebuysAddons - b.rebuysAddons
                )),
            );
        }
    }

    protected readonly fakeAsync = fakeAsync;
}
