import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SeriesApiService } from '../../../core/services/api/series-api.service';
import { combineLatest, Observable, ReplaySubject, timer } from 'rxjs';
import { SeriesMetadata, SeriesS } from '../../../shared/models/series.interface';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { SeriesTournament } from '../../models/combined-ranking.interface';
import { LeaderboardRow } from '../../models/overall-ranking.interface';
import { MathContent } from '../../../shared/models/math-content.interface';
import { SeriesService } from '../../../core/services/series.service';
import { SimpleStat } from '../../../shared/models/simple-stat.interface';
import { RankingService } from '../../../core/services/util/ranking.service';
import { User } from '@auth0/auth0-angular';
import { SeriesTournamentComponent } from '../../components/series-tournament/series-tournament.component';
import { SeriesStatsComponent } from '../../components/series-stats/series-stats.component';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { LeaderboardComponent } from '../../../shared/components/leaderboard/leaderboard.component';
import { SeriesHeaderComponent } from '../../components/series-header/series-header.component';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthUtilService } from '../../../core/services/auth-util.service';
import { MatButtonModule } from '@angular/material/button';
import {
    ConnectToOtherUserDialogComponent
} from '../../../welcome/components/dialogs/connect-to-other-user-dialog/connect-to-other-user-dialog.component';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';
import { NullsafePrimitivePipe } from '../../../core/pipes/nullsafe-primitive.pipe';

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
        NullsafePrimitivePipe
    ]
})
export class SeriesPageComponent implements OnInit {

    user$: Observable<User | undefined | null>;
    userEmail$: Observable<string | undefined>;
    series$: Observable<SeriesS>;
    seriesHeader$: Observable<SeriesHeader>;
    leaderboard$: Observable<LeaderboardRow[]>;
    seriesStats$: Observable<SeriesStats>;
    tournaments$: Observable<SeriesTournament[]>;
    isAuthenticated$: Observable<boolean>;
    ownerEmail$: Observable<string | null>;
    isUserConnectedHere$: Observable<boolean>;

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
            shareReplay(1)
        );

        this.ownerEmail$ = this.series$.pipe(
            map((series) => series.ownerEmail)
        );

        this.seriesHeader$ = this.series$.pipe(
            map((series: SeriesS) => ({
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
            map(([series, metadata]: [SeriesS, SeriesMetadata]) =>
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
