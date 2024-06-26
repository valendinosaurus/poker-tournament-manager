import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { TournamentApiService } from '../../shared/services/api/tournament-api.service';
import { shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CreateTournamentComponent } from './create-tournament/create-tournament.component';
import { DEFAULT_DIALOG_POSITION } from '../../shared/const/app.const';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AdminTournament } from '../../shared/interfaces/tournament.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'app-tournament-tab',
    templateUrl: './tournament-tab.component.html',
    standalone: true,
    imports: [
        MatButtonModule,
        RouterLink,
        AsyncPipe,
        DatePipe
    ]
})
export class TournamentTabComponent implements OnInit {

    tournaments$: Observable<AdminTournament[]>;

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private router: Router = inject(Router);
    private dialog: MatDialog = inject(MatDialog);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private trigger$: ReplaySubject<void>;

    ngOnInit(): void {
        this.trigger$ = new ReplaySubject<void>();

        this.tournaments$ = this.trigger$.pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() => this.tournamentApiService.getForAdmin$()),
            shareReplay(1)
        );

        this.trigger$.next();
    }

    deleteTournament(tournament: AdminTournament, event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

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
                    tap(() => this.trigger$.next())
                )),
                of(null)
            ))
        ).subscribe();
    }

    openTournament(tId: number, event: Event): void {
        event.preventDefault();
        const link = this.router.serializeUrl(this.router.createUrlTree(['timer', tId]));
        window.open(link, '_blank');
    }

    createTournament(): void {
        const ref = this.dialog.open(CreateTournamentComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh',
            data: {
                tournament: null
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
}
