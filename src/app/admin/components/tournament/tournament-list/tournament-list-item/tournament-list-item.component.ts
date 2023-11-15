import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { TournamentDetails } from '../../../../../shared/models/tournament-details.interface';
import { AddBlindsComponent } from '../../../dialogs/add-blinds/add-blinds.component';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { AddPlayerComponent } from '../../../dialogs/add-player/add-player.component';
import { TournamentApiService } from '../../../../../core/services/api/tournament-api.service';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, User } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';
import { AddPauseComponent } from '../../../dialogs/add-pause/add-pause.component';
import { RankingService } from '../../../../../core/services/util/ranking.service';

@Component({
    selector: 'app-tournament-list-item',
    templateUrl: './tournament-list-item.component.html',
    styleUrls: ['./tournament-list-item.component.scss']
})
export class TournamentListItemComponent implements OnInit {

    @Input() t: TournamentDetails;

    sub$: Observable<string>;

    private dialog: MatDialog = inject(MatDialog);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private router: Router = inject(Router);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private authService: AuthService = inject(AuthService);
    private rankingService: RankingService = inject(RankingService);

    payout: number[];

    canInsertPause: boolean[];

    @Output() reload = new EventEmitter<void>();

    ngOnInit(): void {
        this.sub$ = this.authService.user$.pipe(
            map((user: User | null | undefined) => user?.sub ?? '')
        );

        this.payout = this.rankingService.getPayoutById(this.t.payout);

        this.canInsertPause = [];

        this.t.structure.forEach((b, index) => {
            if (index < this.t.structure.length - 1) {
                const isPause = b.isPause;
                const isNextPause = this.t.structure[index + 1].isPause;
                const hasPlace = (this.t.structure[index + 1].position) - (b.position) > 1;

                this.canInsertPause.push(hasPlace);
            } else {
                this.canInsertPause.push(false);
            }
        });
    }

    addBlinds(): void {
        const dialogRef = this.dialog.open(AddBlindsComponent, {
            data: {
                tournament: this.t
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => this.reload.emit())
        ).subscribe();
    }

    addPause(position: number | undefined): void {
        if (position !== undefined) {
            const dialogRef = this.dialog.open(AddPauseComponent, {
                data: {
                    tId: this.t.id,
                    position: position + 1
                }
            });

            dialogRef.afterClosed().pipe(
                takeUntilDestroyed(this.destroyRef),
                tap(() => this.reload.emit())
            ).subscribe();
        }
    }

    addPlayers(): void {
        const dialogRef = this.dialog.open(AddPlayerComponent, {
            data: {
                tournament: this.t,
                multi: true
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => this.reload.emit())
        ).subscribe();
    }

    deleteTournament(): void {
        this.sub$.pipe(
            switchMap((sub: string) => this.tournamentApiService.delete$(this.t.id, sub).pipe(
                take(1),
                tap(() => this.reload.emit())
            ))
        ).subscribe();
    }

    deletePlayerFromTournament(playerId: number): void {
        this.sub$.pipe(
            switchMap((sub: string) => this.tournamentApiService.removePlayer$(playerId, this.t.id, sub).pipe(
                    take(1),
                    tap(() => this.reload.emit())
                )
            )
        ).subscribe();
    }

    deleteBlindFromTournament(blindId: number): void {
        this.sub$.pipe(
            switchMap((sub: string) => this.tournamentApiService.removeBlind$(blindId, this.t.id, sub).pipe(
                    take(1),
                    tap(() => this.reload.emit())
                )
            )
        ).subscribe();
    }

    openTournament(): void {
        //  this.router.navigate(['timer', this.t.id]);
        const link = this.router.serializeUrl(this.router.createUrlTree(['timer', this.t.id]));
        window.open(link, '_blank');
    }
}
