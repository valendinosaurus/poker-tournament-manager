import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { SeriesDetails } from '../../../../../shared/models/series-details.interface';
import { MatDialog } from '@angular/material/dialog';
import { PlayerApiService } from '../../../../../core/services/api/player-api.service';
import { SeriesApiService } from '../../../../../core/services/api/series-api.service';
import { AddTournamentComponent } from '../../../dialogs/add-tournament/add-tournament.component';
import { tap } from 'rxjs/operators';

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

    @Output() reload = new EventEmitter<void>();

    addTournament(): void {
        const dialogRef = this.dialog.open(AddTournamentComponent, {
            data: {
                series: this.s
            }
        });

        dialogRef.afterClosed().pipe(
            tap(() => this.reload.emit())
        ).subscribe();
    }

    deleteSeries(): void {

    }

    deleteTournamentFromSeries(tournamentId: number | undefined): void {

    }
}
