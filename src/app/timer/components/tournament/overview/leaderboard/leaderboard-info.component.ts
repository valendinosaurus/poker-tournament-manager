import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { LeaderboardRow } from '../../../../../series/models/overall-ranking.interface';
import { SeriesMetadata, SeriesS } from '../../../../../shared/models/series.interface';
import { SeriesService } from '../../../../../core/services/series.service';
import { combineLatest, Observable } from 'rxjs';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { SeriesTournament } from '../../../../../series/models/combined-ranking.interface';
import { SeriesApiService } from '../../../../../core/services/api/series-api.service';
import { FetchService } from '../../../../../core/services/fetch.service';
import { AsyncPipe } from '@angular/common';
import { LeaderboardComponent } from '../../../../../shared/components/leaderboard/leaderboard.component';

@Component({
    selector: 'app-leaderboard-info',
    templateUrl: './leaderboard-info.component.html',
    styleUrls: ['./leaderboard-info.component.scss'],
    standalone: true,
    imports: [LeaderboardComponent, AsyncPipe]
})
export class LeaderboardInfoComponent implements OnChanges {

    @Input() seriesMetadata: SeriesMetadata | null;

    series$: Observable<SeriesS>;
    leaderboard$: Observable<any>;

    private seriesService: SeriesService = inject(SeriesService);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private fetchService: FetchService = inject(FetchService);

    ngOnChanges(changes: SimpleChanges): void {
        if (
            changes['seriesMetadata']?.currentValue !== undefined
            && changes['seriesMetadata']?.currentValue !== changes['seriesMetadata']?.previousValue
            && this.seriesMetadata
        ) {

            const id = this.seriesMetadata.id;
            const pw = this.seriesMetadata.password;

            this.series$ = this.fetchService.getFetchTrigger$().pipe(
                switchMap(() => this.seriesApiService.getWithDetailsByPw$(id, pw)),
                shareReplay(1)
            );

            const metadata$ = this.seriesApiService.getSeriesMetadata$(
                this.seriesMetadata.id,
                this.seriesMetadata.password
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

}
