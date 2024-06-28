import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { combineLatest, defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { User } from '@auth0/auth0-angular';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { AuthUtilService } from '../../../shared/services/auth-util.service';
import { MatDialog } from '@angular/material/dialog';
import { SeriesApiService } from '../../../shared/services/api/series-api.service';
import { filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { AddTournamentComponent } from '../../../dialogs/add-tournament/add-tournament.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Series } from '../../../shared/interfaces/series.interface';
import { ConfirmationDialogComponent } from '../../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { CreateSeriesComponent } from '../create-series/create-series.component';
import { DEFAULT_DIALOG_POSITION } from '../../../shared/const/app.const';
import { Player } from '../../../shared/interfaces/player.interface';
import { PlayerApiService } from '../../../shared/services/api/player-api.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { UserWithImageComponent } from '../../../shared/components/user-with-image/user-with-image.component';

@Component({
    selector: 'app-admin-series',
    standalone: true,
    imports: [
        CommonModule,
        AppHeaderComponent,
        MatButtonModule,
        MatTabsModule,
        UserImageRoundComponent,
        RouterLink,
        MatFormFieldModule,
        MatOptionModule,
        MatSelectModule,
        UserWithImageComponent
    ],
    templateUrl: './admin-series.component.html',
})
export class AdminSeriesComponent implements OnInit {

    series$: Observable<Series>;
    user$: Observable<User>;
    sub$: Observable<string>;
    sId$: Observable<number>;
    playersEligibleForDisqualification$: Observable<Player[]>;
    disqualifiedPlayers$: Observable<Player[]>;

    private route: ActivatedRoute = inject(ActivatedRoute);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private dialog: MatDialog = inject(MatDialog);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private trigger$: ReplaySubject<void> = new ReplaySubject<void>();
    private router: Router = inject(Router);

    ngOnInit(): void {
        this.user$ = this.authUtilService.getUser$();
        this.sub$ = this.authUtilService.getSub$();

        this.sId$ = this.route.paramMap.pipe(
            map((params: Params) => params.params.id),
            filter((id: string | null): id is string => id !== null),
            map((id: string) => +id)
        );

        this.series$ = combineLatest([
            this.trigger$,
            this.sId$
        ]).pipe(
            switchMap(([_, sId]: [void, number]) =>
                this.seriesApiService.get$(sId)
            ),
            shareReplay(1)
        );

        this.disqualifiedPlayers$ = combineLatest([
            this.trigger$,
            this.sId$
        ]).pipe(
            switchMap(([_, sId]: [void, number]) => this.seriesApiService.getDisqualifiedPlayers$(sId)),
            shareReplay(1)
        );

        this.playersEligibleForDisqualification$ = combineLatest([
            this.playerApiService.getAll$(),
            this.disqualifiedPlayers$
        ]).pipe(
            map(([all, disqualified]: [Player[], Player[]]) =>
                all.filter(
                    (player: Player) => !disqualified.map(p => p.id).includes(player.id)
                )
            )
        );

        this.trigger$.next();
    }

    editSeries(series: Series): void {
        const ref = this.dialog.open(CreateSeriesComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh',
            data: {
                series: series
            }
        });

        ref.afterClosed().pipe(
            take(1),
            tap((e) => {
                if (e) {
                    this.trigger$.next();
                }
            })
        ).subscribe();
    }

    addTournament(series: Series): void {
        const dialogRef = this.dialog.open(AddTournamentComponent, {
            data: {
                series: series
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => this.trigger$.next())
        ).subscribe();
    }

    deleteSeries(series: Series): void {
        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Delete Series?',
                    body: `Do you really want to delete series <strong>${series.name}</strong>`,
                    confirm: 'Delete Series',
                    isDelete: true
                }
            });

        dialogRef.afterClosed().pipe(
            switchMap((confirmed) => iif(
                () => confirmed,
                defer(() => this.seriesApiService.delete$(series.id).pipe(
                    take(1),
                    tap(() => this.router.navigate(['/admin/series']))
                )),
                of(null)
            ))
        ).subscribe();
    }

    deleteTournamentFromSeries(series: Series, tournamentId: number): void {
        this.seriesApiService.removeTournament$(tournamentId, series.id).pipe(
            take(1),
            tap(() => this.trigger$.next())
        ).subscribe();
    }

    openSeries(sId: number, password: string): void {
        const link = this.router.serializeUrl(this.router.createUrlTree(['series', sId, password]));
        window.open(link, '_blank');
    }

    lock(series: Series): void {
        this.seriesApiService.put$({
            ...series,
            locked: true,
            branding: series.branding.id,
            finalTournament: series.finalTournament?.id ?? -1,
            rankFormula: series.rankFormula.id ?? null
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

    unlock(series: Series): void {
        this.seriesApiService.put$({
            ...series,
            locked: false,
            branding: series.branding.id,
            finalTournament: series.finalTournament?.id ?? -1,
            rankFormula: series.rankFormula.id
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

    disqualifyPlayer(seriesId: number, playerId: number): void {
        this.seriesApiService.disqualifyPlayer(seriesId, playerId).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

    removeDisqualification(seriesId: number, playerId: number): void {
        this.seriesApiService.removeDisqualifiedPlayer(seriesId, playerId).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

}
