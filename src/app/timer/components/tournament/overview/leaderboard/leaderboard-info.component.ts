import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { OverallRanking } from '../../../../../series/models/overall-ranking.interface';
import { SeriesDetails } from '../../../../../shared/models/series-details.interface';
import { SeriesService } from '../../../../../core/services/series.service';
import { Finish } from '../../../../../shared/models/finish.interface';
import { Entry } from '../../../../../shared/models/entry.interface';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { PlayerInSeries } from '../../../../../shared/models/player-in-series.interface';
import { TournamentInSeries } from '../../../../../shared/models/tournament-in-series.interface';
import { SeriesMetadata } from '../../../../../shared/models/series-metadata.interface';
import { CombinedRanking } from '../../../../../series/models/combined-ranking.interface';
import { SeriesApiService } from '../../../../../core/services/api/series-api.service';
import { EntryApiService } from '../../../../../core/services/api/entry-api.service';
import { FinishApiService } from '../../../../../core/services/api/finish-api.service';
import { PlayerApiService } from '../../../../../core/services/api/player-api.service';
import { TournamentApiService } from '../../../../../core/services/api/tournament-api.service';
import { FetchService } from '../../../../../core/services/fetch.service';

@Component({
    selector: 'app-leaderboard-info',
    templateUrl: './leaderboard-info.component.html',
    styleUrls: ['./leaderboard-info.component.scss']
})
export class LeaderboardInfoComponent implements OnChanges {

    @Input() seriesMetadata: SeriesMetadata | null;

    combinedRankings: CombinedRanking[];
    overallRanking: OverallRanking[];
    series$: Observable<SeriesDetails | null>;

    private seriesService: SeriesService = inject(SeriesService);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private finishApiService: FinishApiService = inject(FinishApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private fetchService: FetchService = inject(FetchService);

    ngOnChanges(changes: SimpleChanges): void {
        if (
            changes['seriesMetadata']?.currentValue !== undefined
            && changes['seriesMetadata']?.currentValue !== changes['seriesMetadata']?.previousValue
            && this.seriesMetadata
        ) {

            const metadata = this.seriesMetadata;

            this.series$ = this.seriesApiService.getWithDetailsByPw$(
                this.seriesMetadata.id,
                this.seriesMetadata.password
            ).pipe(
                map(series => series ? ({
                    ...series,
                    tournaments: series.tournaments.reverse()
                }) : null)
            );

            this.fetchService.getFetchTrigger$().pipe(
                switchMap(() => combineLatest([
                    this.finishApiService.getInSeries$(metadata.id),
                    this.entryApiService.getInSeries$(metadata.id),
                    this.playerApiService.getInSeries$(
                        metadata.id,
                        metadata.password
                    ),
                    this.tournamentApiService.getInSeries$(
                        metadata.id,
                        metadata.password
                    ),
                    this.seriesApiService.getSeriesMetadata$(
                        metadata.id,
                        metadata.password
                    )
                ]).pipe(
                    tap(([finishes, entries, players, tournaments, seriesMetadata]: [Finish[], Entry[], PlayerInSeries[], TournamentInSeries[], SeriesMetadata]) => {
                        const res = this.seriesService.calculateRankings(
                            finishes,
                            entries,
                            players,
                            tournaments,
                            seriesMetadata
                        );

                        this.combinedRankings = res[1];
                        this.overallRanking = this.seriesService.merge(this.combinedRankings);
                        this.overallRanking = this.seriesService.getSoretedOverallRanking([...this.overallRanking]);
                    })
                ))
            ).subscribe();
        }
    }

    ngOnInit(): void {
    }

}
