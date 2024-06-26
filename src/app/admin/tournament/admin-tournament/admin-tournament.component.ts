import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { TournamentApiService } from '../../../shared/services/api/tournament-api.service';
import { AuthUtilService } from '../../../shared/services/auth-util.service';
import { combineLatest, defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { Tournament } from '../../../shared/interfaces/tournament.interface';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { DEFAULT_DIALOG_POSITION } from '../../../shared/const/app.const';
import { CreateTournamentComponent } from '../create-tournament/create-tournament.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { User } from '@auth0/auth0-angular';
import { MatTabsModule } from '@angular/material/tabs';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { AddBlindsComponent } from '../../../dialogs/add-blinds/add-blinds.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AddPauseComponent } from '../../../dialogs/add-pause/add-pause.component';
import { AddPlayerComponent } from '../../../dialogs/add-player/add-player.component';
import { ConfirmationDialogComponent } from '../../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { CopyTournamentComponent } from '../copy-tournament/copy-tournament.component';
import { BlindLevel } from '../../../shared/interfaces/blind-level.interface';
import { SaveAsStructureComponent } from '../../blind-structure/save-as-structure/save-as-structure.component';
import {
    BlindStructureViewComponent
} from '../../../shared/components/blind-structure-view/blind-structure-view.component';
import { AssignBlindStructureComponent } from '../assign-blind-structure/assign-blind-structure.component';
import { TimerStateService } from '../../../timer/services/timer-state.service';
import { UserWithImageComponent } from '../../../shared/components/user-with-image/user-with-image.component';

@Component({
    selector: 'app-admin-tournament',
    templateUrl: './admin-tournament.component.html',
    standalone: true,
    imports: [
        RouterLink,
        AsyncPipe,
        MatDialogModule,
        AppHeaderComponent,
        DatePipe,
        MatTabsModule,
        UserImageRoundComponent,
        MatSidenavModule,
        MatButtonModule,
        DecimalPipe,
        BlindStructureViewComponent,
        UserWithImageComponent
    ]
})
export class AdminTournamentComponent implements OnInit {

    tournament$: Observable<Tournament>;
    user$: Observable<User>;
    sub$: Observable<string>;
    tId$: Observable<number>;

    private route: ActivatedRoute = inject(ActivatedRoute);
    private router: Router = inject(Router);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private dialog: MatDialog = inject(MatDialog);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private trigger$: ReplaySubject<void> = new ReplaySubject<void>();
    private state: TimerStateService = inject(TimerStateService);

    blindPositions: number[];

    ngOnInit(): void {
        this.user$ = this.authUtilService.getUser$();
        this.sub$ = this.authUtilService.getSub$();

        this.tId$ = this.route.paramMap.pipe(
            map((params: Params) => params.params.id),
            filter((id: string | null): id is string => id !== null),
            map((id: string) => +id)
        );

        this.tournament$ = combineLatest([
            this.trigger$,
            this.tId$
        ]).pipe(
            switchMap(([_, tId]: [void, number]) =>
                this.tournamentApiService.get$(tId)
            ),
            tap((tournament: Tournament) => {
                this.blindPositions = tournament.structure.map(e => e.position);
                this.state.tournament.set(tournament);
            })
        );

        this.trigger$.next();
    }

    deletePlayerFromTournament(playerId: number): void {
        // TODO check if there are entries etc.
        this.tournament$.pipe(
            take(1),
            switchMap((tournament: Tournament) =>
                this.tournamentApiService.removePlayer$(playerId, tournament.id).pipe(
                    take(1),
                    tap(() => this.trigger$.next())
                )
            )
        ).subscribe();
    }

    deleteBlindFromTournament(blindId: number): void {
        this.tournament$.pipe(
            take(1),
            switchMap((tournament: Tournament) =>
                this.tournamentApiService.removeBlind$(blindId, tournament.id).pipe(
                    take(1),
                    tap(() => this.trigger$.next())
                )
            )
        ).subscribe();
    }

    updateBlindStructure(levels: BlindLevel[], tournamentId: number): void {
        const blindIds: number[] = levels.map((e) => e.id);
        const positions: number[] = levels.map((e) => e.position);

        this.tournamentApiService.removeAllBlinds$(tournamentId).pipe(
            take(1),
            switchMap(() => this.tournamentApiService.addBlinds$(
                blindIds,
                tournamentId,
                positions
            )),
            tap(() => this.trigger$.next())
        ).subscribe();
    }

    editTournament(tournament: Tournament): void {
        const ref = this.dialog.open(CreateTournamentComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh',
            data: {
                tournament
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

    addBlinds(tournament: Tournament): void {
        const dialogRef = this.dialog.open(AddBlindsComponent, {
            data: {
                tournament: tournament
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => this.trigger$.next())
        ).subscribe();
    }

    addPause(tournament: Tournament, position: number | undefined): void {
        if (position !== undefined) {
            const dialogRef = this.dialog.open(AddPauseComponent, {
                data: {
                    tId: tournament.id,
                    position: position + 1
                }
            });

            dialogRef.afterClosed().pipe(
                takeUntilDestroyed(this.destroyRef),
                tap(() => this.trigger$.next())
            ).subscribe();
        }
    }

    saveAsBlindStructure(structure: BlindLevel[]): void {
        const dialogRef = this.dialog.open(SaveAsStructureComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                structure
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => this.trigger$.next())
        ).subscribe();
    }

    assignBlindStructrue(tournament: Tournament): void {
        const dialogRef = this.dialog.open(AssignBlindStructureComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                tournament
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => this.trigger$.next())
        ).subscribe();
    }

    addPlayers(tournament: Tournament): void {
        const dialogRef = this.dialog.open(AddPlayerComponent, {
            data: {
                multi: true
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => this.trigger$.next())
        ).subscribe();
    }

    copyTournament(tournament: Tournament): void {
        const dialogRef = this.dialog.open(CopyTournamentComponent, {
            data: {
                tournament: tournament,
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => this.trigger$.next())
        ).subscribe();
    }

    deleteTournament(tournament: Tournament): void {
        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Delete Tournament?',
                    body: `Do you really want to delete tournament <strong>${tournament.name}</strong>`,
                    confirm: 'Delete Tournament',
                    isDelete: true
                }
            });

        dialogRef.afterClosed().pipe(
            switchMap((confirmed) => iif(
                () => confirmed,
                defer(() => this.tournamentApiService.delete$(tournament.id).pipe(
                    take(1),
                    tap(() => this.router.navigate(['/admin']))
                )),
                of(null)
            ))
        ).subscribe();
    }

    lock(tournament: Tournament): void {
        this.tournamentApiService.put$({
            ...tournament,
            locked: true,
            date: new Date(tournament.date).toISOString(),
            rankFormula: tournament.rankFormula?.id ?? null
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

    unlock(tournament: Tournament): void {
        this.tournamentApiService.put$({
            ...tournament,
            locked: false,
            date: new Date(tournament.date).toISOString(),
            rankFormula: tournament.rankFormula?.id ?? null
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

    openTournament(tId: number): void {
        const link = this.router.serializeUrl(this.router.createUrlTree(['timer', tId]));
        window.open(link, '_blank');
    }

}
