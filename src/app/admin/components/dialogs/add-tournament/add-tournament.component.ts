import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { Series } from '../../../../shared/models/series.interface';
import { TournamentApiService } from '../../../../core/services/api/tournament-api.service';
import { SeriesApiService } from '../../../../core/services/api/series-api.service';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-add-tournament',
    templateUrl: './add-tournament.component.html',
    styleUrls: ['./add-tournament.component.scss']
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

    allTournaments: { label: string, value: number }[];

    ngOnInit(): void {
        this.tournamentApiService.getAllWithoutSeries$().pipe(
            tap((t: { label: string, value: number }[]) => {
                this.allTournaments = t;
                this.initModel();
                this.initFields();
            })
        ).subscribe();
    }

    initModel(): void {
        this.model = {
            seriesId: this.data.series.id ?? -1,
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
            this.seriesApiService.addTournament$(model.tournamentId, this.data.series.id ?? -1).pipe(
                tap(() => {
                    if (this.dialogRef) {
                        this.dialogRef.close();
                    }
                })
            ).subscribe();
        }
    }

}
