import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { TournamentApiService } from '../../../core/services/api/tournament-api.service';
import { AuthUtilService } from '../../../core/services/auth-util.service';
import { combineLatest, defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { Tournament } from '../../../shared/models/tournament.interface';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';
import { CreateTournamentComponent } from '../create-tournament/create-tournament.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AsyncPipe, DatePipe, DecimalPipe, JsonPipe, NgForOf, NgIf } from '@angular/common';
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

@Component({
    selector: 'app-admin-tournament',
    templateUrl: './admin-tournament.component.html',
    standalone: true,
    imports: [RouterLink, AsyncPipe, JsonPipe, MatDialogModule, NgIf, AppHeaderComponent, DatePipe, MatTabsModule, UserImageRoundComponent, NgForOf, MatSidenavModule, MatButtonModule, DecimalPipe]
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
            this.tId$,
            this.sub$
        ]).pipe(
            switchMap(([_, tId, sub]: [void, number, string]) =>
                this.tournamentApiService.get$(tId, sub)
            ),
            tap((tournament: Tournament) => this.blindPositions = tournament.structure.map(e => e.position))
        );

        this.trigger$.next();
    }

    deletePlayerFromTournament(playerId: number): void {
        combineLatest([
            this.sub$,
            this.tournament$
        ]).pipe(
            take(1),
            switchMap(([sub, tournament]: [string, Tournament]) =>
                this.tournamentApiService.removePlayer$(playerId, tournament.id, sub).pipe(
                    take(1),
                    tap(() => this.trigger$.next())
                )
            )
        ).subscribe();
    }

    deleteBlindFromTournament(blindId: number): void {
        combineLatest([
            this.sub$,
            this.tournament$
        ]).pipe(
            take(1),
            switchMap(([sub, tournament]: [string, Tournament]) =>
                this.tournamentApiService.removeBlind$(blindId, tournament.id, sub).pipe(
                    take(1),
                    tap(() => this.trigger$.next())
                )
            )
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

    addPlayers(tournament: Tournament): void {
        const dialogRef = this.dialog.open(AddPlayerComponent, {
            data: {
                tournament: tournament,
                multi: true,
                clientId: -1
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
                defer(() => this.authUtilService.getSub$().pipe(
                    switchMap((sub: string) => this.tournamentApiService.delete$(tournament.id, sub).pipe(
                        take(1),
                        tap(() => this.router.navigate(['/admin']))
                    ))
                )),
                of(null)
            ))
        ).subscribe();
    }

    lock(tournament: Tournament): void {
        this.tournamentApiService.put$({
            ...tournament,
            locked: true,
            date: new Date(tournament.date).toISOString()
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

    unlock(tournament: Tournament): void {
        this.tournamentApiService.put$({
            ...tournament,
            locked: false,
            date: new Date(tournament.date).toISOString()
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

}
