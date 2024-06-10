import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormlyFieldService } from '../../core/services/util/formly-field.service';
import { TournamentApiService } from '../../core/services/api/tournament-api.service';
import { SeriesApiService } from '../../core/services/api/series-api.service';
import { take, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Series } from '../../shared/interfaces/series.interface';

@Component({
    selector: 'app-add-tournament',
    templateUrl: './add-tournament.component.html',
    styleUrls: ['./add-tournament.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule]
})
export class AddTournamentComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: { seriesId: number, tournamentId: number | undefined };
    fields: FormlyFieldConfig[];

    private dialogRef: MatDialogRef<AddTournamentComponent> = inject(MatDialogRef<AddTournamentComponent>);
    data: { series: Series } = inject(MAT_DIALOG_DATA);

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private destroyRef: DestroyRef = inject(DestroyRef);

    allTournaments: { label: string, value: number }[];

    ngOnInit(): void {
        this.tournamentApiService.getAllWithoutSeries$().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((t: { label: string, value: number }[]) => {
                this.allTournaments = t;
                this.initModel();
                this.initFields();
            })
        ).subscribe();
    }

    initModel(): void {
        this.model = {
            seriesId: this.data.series.id,
            tournamentId: undefined
        };
    }

    initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultSelectField('tournamentId', 'Tournament', true, this.allTournaments)
        ];
    }

    onSubmit(model: { seriesId: number, tournamentId: number | undefined }): void {
        if (model.seriesId && model.tournamentId) {
            this.seriesApiService.addTournament$(model.tournamentId, this.data.series.id).pipe(
                take(1),
                tap(() => {
                    if (this.dialogRef) {
                        this.dialogRef.close();
                    }
                })
            ).subscribe();
        }
    }

}
