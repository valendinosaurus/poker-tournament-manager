import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SeriesApiService } from '../../../shared/services/api/series-api.service';
import { combineLatest, Observable, ReplaySubject, timer } from 'rxjs';
import { SeriesMetadata, SeriesS } from '../../../shared/interfaces/series.interface';
import { delay, filter, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { SeriesTournament } from '../../interfaces/series-tournament.interface';
import { LeaderboardRow } from '../../interfaces/overall-ranking.interface';
import { SeriesService } from '../../../shared/services/series.service';
import { RankingService } from '../../../shared/services/util/ranking.service';
import { User } from '@auth0/auth0-angular';
import { SeriesTournamentComponent } from '../../components/series-tournament/series-tournament.component';
import { SeriesStatsComponent } from '../../components/series-stats/series-stats.component';
import { AsyncPipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { LeaderboardComponent } from '../../../shared/components/leaderboard/leaderboard.component';
import { SeriesHeaderComponent } from '../../components/series-header/series-header.component';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthUtilService } from '../../../shared/services/auth-util.service';
import { MatButtonModule } from '@angular/material/button';
import {
    ConnectToOtherUserDialogComponent
} from '../../../welcome/components/dialogs/connect-to-other-user-dialog/connect-to-other-user-dialog.component';
import { DEFAULT_DIALOG_POSITION } from '../../../shared/const/app.const';
import { NullsafePrimitivePipe } from '../../../shared/pipes/nullsafe-primitive.pipe';
import { SeriesHeader } from '../../interfaces/series-header.interface';
import { SeriesStats } from '../../interfaces/series-stats.interface';
import { TournamentS } from '../../../shared/interfaces/tournament.interface';
import { RankFormulaApiService } from '../../../shared/services/api/rank-formula-api.service';

@Component({
    selector: 'app-series-page',
    templateUrl: './series-page.component.html',
    styleUrls: ['./series-page.component.scss'],
    standalone: true,
    imports: [
        AppHeaderComponent,
        SeriesHeaderComponent,
        LeaderboardComponent,
        NgIf,
        SeriesStatsComponent,
        NgFor,
        SeriesTournamentComponent,
        AsyncPipe,
        MatDialogModule,
        MatButtonModule,
        NullsafePrimitivePipe,
        JsonPipe
    ]
})
export class SeriesPageComponent implements OnInit {

    user$: Observable<User | undefined | null>;
    userEmail$: Observable<string | undefined>;
    series$: Observable<SeriesS | null>;
    seriesHeader$: Observable<SeriesHeader>;
    leaderboard$: Observable<LeaderboardRow[]>;
    seriesStats$: Observable<SeriesStats>;
    tournaments$: Observable<SeriesTournament[]>;
    isAuthenticated$: Observable<boolean>;
    ownerEmail$: Observable<string | null>;
    isUserConnectedHere$: Observable<boolean>;
    isLoadingSeries$: Observable<boolean>;
    hasRebuy$: Observable<boolean>;
    hasAddon$: Observable<boolean>;

    seriesId: number;
    password: string;

    private route: ActivatedRoute = inject(ActivatedRoute);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private seriesService: SeriesService = inject(SeriesService);
    private rankingService: RankingService = inject(RankingService);
    private router: Router = inject(Router);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private dialog: MatDialog = inject(MatDialog);
    private rankFormulaApiService: RankFormulaApiService = inject(RankFormulaApiService);

    private trigger$ = new ReplaySubject<void>();

    ngOnInit(): void {
        this.seriesId = this.route.snapshot.params['sId'];
        this.password = this.route.snapshot.params['password'];
        this.user$ = this.authUtilService.getUser$();
        this.userEmail$ = this.authUtilService.getEmail$();
        this.isAuthenticated$ = this.authUtilService.getIsAuthenticated$();

        this.series$ = combineLatest([
            timer(0, 60000),
            this.trigger$
        ]).pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() => this.seriesApiService.getWithDetailsByPw$(this.seriesId, this.password).pipe(
                tap((e) => {
                    if (Object.keys(e).length < 3) {
                        this.router.navigate(['not-found']);
                    }
                })
            )),
            startWith(null),
            shareReplay(1)
        );

        this.isLoadingSeries$ = this.series$.pipe(
            delay(1000),
            map((series: SeriesS | null) => series === null),
            startWith(true)
        );

        const nonNullSeries$ = this.series$.pipe(
            filter((series: SeriesS | null): series is SeriesS => series !== null)
        );

        this.ownerEmail$ = nonNullSeries$.pipe(
            map((series) => series.ownerEmail)
        );

        this.seriesHeader$ = nonNullSeries$.pipe(
            map((series: SeriesS) => ({
                    formulaMathContent: {
                        latex: series.rankFormula.description
                    },
                    formulaLatexString: series.rankFormula.description,
                    guaranteed: this.seriesService.getGuaranteedFromSeries(series),
                    logo: series.branding.logo,
                    name: series.name,
                    tournamentsPlayed: series.tournaments.length,
                    totalTournaments: series.noOfTournaments,
                    percentageToFinalPot: series.percentage,
                    maxAmountPerTournament: series.maxAmountPerTournament,
                })
            ),
            // map((series: SeriesS) => ({
            //         logo: series.branding.logo,
            //         name: series.name,
            //         tournamentsPlayed: series.tournaments.length,
            //         totalTournaments: series.noOfTournaments,
            //         percentageToFinalPot: series.percentage,
            //         maxAmountPerTournament: series.maxAmountPerTournament,
            //         guaranteed: this.seriesService.getGuaranteedFromSeries(series),
            //         formulaMathContent: {
            //             latex: this.rankingService.getFormulaDesc$(series.rankFormula)
            //         },
            //         formulaLatexString: this.rankingService.getFormulaDesc$(series.rankFormula)
            //     })
            // )
        );

        const metadata$ = this.seriesApiService.getSeriesMetadata$(this.seriesId, this.password).pipe(
            shareReplay(1)
        );

        this.tournaments$ = combineLatest([
            nonNullSeries$,
            metadata$
        ]).pipe(
            map(([series, metadata]: [SeriesS, SeriesMetadata]) =>
                this.seriesService.calculateSeriesTournaments(series, metadata)
            ),
            map((tournaments: SeriesTournament[]) => tournaments.sort(
                (a: SeriesTournament, b: SeriesTournament) => new Date(b.tournament.date).getTime() - new Date(a.tournament.date).getTime()
            ))
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

        this.isUserConnectedHere$ = combineLatest([
            this.userEmail$,
            this.leaderboard$
        ]).pipe(
            map(([userEmail, leaderboard]: [string | undefined, LeaderboardRow[]]) =>
                userEmail === undefined
                    ? false
                    : leaderboard.some(
                        (leaderboardRow: LeaderboardRow) => leaderboardRow.email === userEmail
                    )
            )
        );

        this.hasRebuy$ = this.series$.pipe(
            filter((series: SeriesS | null): series is SeriesS => series !== null),
            map((series: SeriesS) => series.tournaments),
            map((tournaments: TournamentS[]) => tournaments.some((tournament: TournamentS) => tournament.withRebuy))
        );

        this.hasAddon$ = this.series$.pipe(
            filter((series: SeriesS | null): series is SeriesS => series !== null),
            map((series: SeriesS) => series.tournaments),
            map((tournaments: TournamentS[]) => tournaments.some((tournament: TournamentS) => tournament.withAddon))
        );

        this.trigger$.next();
    }

    connectToOtherUser(ownerEmail: string): void {
        this.dialog.open(ConnectToOtherUserDialogComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                ownerEmail
            }
        });
    }

}
