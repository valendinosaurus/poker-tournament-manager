import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SeriesApiService } from '../../../core/services/api/series-api.service';
import { combineLatest, Observable } from 'rxjs';
import { SeriesDetails } from '../../../shared/models/series-details.interface';
import { RankingService } from '../../../core/services/util/ranking.service';
import { Entry } from '../../../shared/models/entry.interface';
import { Finish } from '../../../shared/models/finish.interface';
import { EntryApiService } from '../../../core/services/api/entry-api.service';
import { FinishApiService } from '../../../core/services/api/finish-api.service';
import { map, tap } from 'rxjs/operators';
import { PlayerApiService } from '../../../core/services/api/player-api.service';
import { TournamentApiService } from '../../../core/services/api/tournament-api.service';
import { SeriesMetadata } from '../../../shared/models/series-metadata.interface';
import { TournamentInSeries } from '../../../shared/models/tournament-in-series.interface';
import { PlayerInSeries } from '../../../shared/models/player-in-series.interface';
import { CombinedEntriesFinishes } from '../../models/combined-entries-finishes.interface';
import { CombinedRanking } from '../../models/combined-ranking.interface';
import { OverallRanking } from '../../models/overall-ranking.interface';
import { MathContent } from '../../../shared/models/math-content.interface';
import { SeriesService } from '../../../core/services/series.service';
import { SimpleStat } from '../../../shared/models/simple-stat.interface';
import { TEventApiService } from '../../../core/services/api/t-event-api.service';

@Component({
    selector: 'app-series-page',
    templateUrl: './series-page.component.html',
    styleUrls: ['./series-page.component.scss']
})
export class SeriesPageComponent implements OnInit {

    private route: ActivatedRoute = inject(ActivatedRoute);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private finishApiService: FinishApiService = inject(FinishApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private rankingService: RankingService = inject(RankingService);
    private seriesService: SeriesService = inject(SeriesService);

    series$: Observable<SeriesDetails | null>;

    combined: CombinedEntriesFinishes[] = [];
    combinedRankings: CombinedRanking[] = [];
    overallRanking: OverallRanking[];

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

        this.series$ = this.seriesApiService.getWithDetailsByPw$(this.seriesId, this.password).pipe(
            map(series => series ? ({
                ...series,
                tournaments: series.tournaments.reverse()
            }) : null),
            tap((series: SeriesDetails | null) => {

                this.formulaString = {
                    latex: this.rankingService.getFormulaDesc(series?.rankFormula)
                };

                if (series) {
                    this.getRankings();
                }

            })
        );
    }

    private getRankings(): void {
        combineLatest([
            this.finishApiService.getInSeries$(this.seriesId),
            this.entryApiService.getInSeries$(this.seriesId),
            this.playerApiService.getInSeries$(this.seriesId, this.password),
            this.tournamentApiService.getInSeries$(this.seriesId, this.password),
            this.seriesApiService.getSeriesMetadata$(this.seriesId, this.password),
        ]).pipe(
            tap(([finishes, entries, players, tournaments, seriesMetadata]: [Finish[], Entry[], PlayerInSeries[], TournamentInSeries[], SeriesMetadata]) => {
                const res = this.seriesService.calculateRankings(
                    finishes,
                    entries,
                    players,
                    tournaments,
                    seriesMetadata
                );

                this.combined = res[0];
                this.combinedRankings = res[1];
                this.overallRanking = this.seriesService.merge(this.combinedRankings);
                this.overallRanking = this.seriesService.getSoretedOverallRanking([...this.overallRanking]);
                this.guaranteed = this.seriesService.getGuaranteed(this.combinedRankings);
                this.calcStats();
            })
        ).subscribe();
    }

    calcStats(): void {
        this.bestAverageRank = this.seriesService.getBestAverageRank(this.overallRanking);
        this.mostPrices = this.seriesService.getMostPrices([...this.overallRanking]);
        this.mostEffPrices = this.seriesService.getMostEffectivePrices([...this.overallRanking]);
        this.mostRebuysAddons = this.seriesService.getMostRebuysAddons([...this.overallRanking]);
        this.mostRebuysAddonsPerT = this.seriesService.getMostRebuysAddonsPerTournament([...this.overallRanking]);
        this.mostITM = this.seriesService.getMostITM([...this.overallRanking]);
        this.mostPercITM = this.seriesService.getMostPercentualITM([...this.overallRanking]);

    }
}
