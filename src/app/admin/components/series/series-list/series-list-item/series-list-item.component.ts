import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { SeriesDetails } from '../../../../../shared/models/series-details.interface';
import { MatDialog } from '@angular/material/dialog';
import { SeriesApiService } from '../../../../../core/services/api/series-api.service';
import { AddTournamentComponent } from '../../../dialogs/add-tournament/add-tournament.component';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { AuthService, User } from '@auth0/auth0-angular';

@Component({
    selector: 'app-series-list-item',
    templateUrl: './series-list-item.component.html',
    styleUrls: ['./series-list-item.component.scss']
})
export class SeriesListItemComponent implements OnInit {

    @Input() s: SeriesDetails;

    private dialog: MatDialog = inject(MatDialog);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private authService: AuthService = inject(AuthService);

    sub$: Observable<string>;

    @Output() reload = new EventEmitter<void>();

    ngOnInit(): void {
        this.sub$ = this.authService.user$.pipe(
            map((user: User | null | undefined) => user?.sub ?? '')
        );
    }

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
        this.sub$.pipe(
            switchMap((sub: string) => this.seriesApiService.delete$(this.s.id, sub).pipe(
                take(1),
                tap(() => this.reload.emit())
            ))
        ).subscribe();
    }

    deleteTournamentFromSeries(tournamentId: number | undefined): void {

    }
}
