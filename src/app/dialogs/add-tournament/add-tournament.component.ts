import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TournamentApiService } from '../../shared/services/api/tournament-api.service';
import { SeriesApiService } from '../../shared/services/api/series-api.service';
import { catchError, take, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Series } from '../../shared/interfaces/series.interface';
import { BaseAddDialogComponent } from '../../shared/components/base-add-dialog/base-add-dialog.component';
import { AddTournamentModel } from './add-tournament-model.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { of } from 'rxjs';

@Component({
    selector: 'app-add-tournament',
    templateUrl: './add-tournament.component.html',
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatOptionModule,
        MatSelectModule
    ]
})
export class AddTournamentComponent extends BaseAddDialogComponent<AddTournamentComponent, AddTournamentModel> implements OnInit {

    data: { series: Series } = inject(MAT_DIALOG_DATA);

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private destroyRef: DestroyRef = inject(DestroyRef);

    allTournaments: { label: string, value: number }[];

    ngOnInit(): void {
        this.initModel();

        this.tournamentApiService.getAllWithoutSeries$().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((t: { label: string, value: number }[]) => {
                this.allTournaments = t;
            })
        ).subscribe();
    }

    initModel(): void {
        this.model = {
            seriesId: signal(this.data.series.id),
            tournamentId: signal(undefined),
            isValid: computed(() => this.model.tournamentId() !== undefined)
        };
    }

    onSubmit(): void {
        this.isLoadingAdd = true;

        if (this.model.seriesId() && this.model.tournamentId()) {
            this.seriesApiService.addTournament$(this.model.tournamentId()!, this.data.series.id).pipe(
                take(1),
                tap(() => {
                    if (this.dialogRef) {
                        this.dialogRef.close();
                        this.isLoadingAdd = false;
                    }
                }),
                catchError(() => {
                    this.isLoadingAdd = false;
                    return of(null);
                })
            ).subscribe();
        }
    }

}
