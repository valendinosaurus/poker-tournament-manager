import { Component, DestroyRef, EventEmitter, inject, Input, Output } from '@angular/core';
import { TournamentDetails } from '../../../../../shared/models/tournament-details.interface';
import { AddBlindsComponent } from '../../../dialogs/add-blinds/add-blinds.component';
import { take, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { BlindLevelApiService } from '../../../../../core/services/api/blind-level-api.service';
import { PlayerApiService } from '../../../../../core/services/api/player-api.service';
import { AddPlayerComponent } from '../../../dialogs/add-player/add-player.component';
import { TournamentApiService } from '../../../../../core/services/api/tournament-api.service';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-tournament-list-item',
    templateUrl: './tournament-list-item.component.html',
    styleUrls: ['./tournament-list-item.component.scss']
})
export class TournamentListItemComponent {

    @Input() t: TournamentDetails;

    isExpanded = false;

    private dialog: MatDialog = inject(MatDialog);
    private blindApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private router: Router = inject(Router);
    private destroyRef: DestroyRef = inject(DestroyRef);

    @Output() reload = new EventEmitter<void>();

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
        this.tournamentApiService.delete$(this.t.id ?? -1).pipe(
            take(1),
            tap(() => this.reload.emit())
        ).subscribe();
    }

    deletePlayerFromTournament(playerId: number | undefined): void {
        this.tournamentApiService.removePlayer$(playerId ?? -1, this.t.id ?? -1).pipe(
            take(1),
            tap(() => this.reload.emit())
        ).subscribe();
    }

    deleteBlindFromTournament(blindId: number | undefined): void {
        this.tournamentApiService.removeBlind$(blindId ?? -1, this.t.id ?? -1).pipe(
            take(1),
            tap(() => this.reload.emit())
        ).subscribe();
    }

    openTournament(): void {
        this.router.navigate(['timer', this.t.id]);
    }
}
