import { Component, DestroyRef, EventEmitter, inject, Input, Output } from '@angular/core';
import { SeriesDetails } from '../../../../../shared/models/series-details.interface';
import { MatDialog } from '@angular/material/dialog';
import { PlayerApiService } from '../../../../../core/services/api/player-api.service';
import { SeriesApiService } from '../../../../../core/services/api/series-api.service';
import { AddTournamentComponent } from '../../../dialogs/add-tournament/add-tournament.component';
import { tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-series-list-item',
    templateUrl: './series-list-item.component.html',
    styleUrls: ['./series-list-item.component.scss']
})
export class SeriesListItemComponent {

    @Input() s: SeriesDetails;

    private dialog: MatDialog = inject(MatDialog);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private destroyRef: DestroyRef = inject(DestroyRef);

    @Output() reload = new EventEmitter<void>();

    addTournament(): void {
        const dialogRef = this.dialog.open(AddTournamentComponent, {
            data: {
                series: this.s
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => this.reload.emit())
        ).subscribe();
    }

    deleteSeries(): void {

    }

    deleteTournamentFromSeries(tournamentId: number | undefined): void {

    }
}
