import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { shareReplay, tap } from 'rxjs/operators';
import { BlindLevelApiService } from '../../../../core/services/api/blind-level-api.service';
import { BlindLevel } from '../../../../shared/models/blind-level.interface';
import { TournamentApiService } from '../../../../core/services/api/tournament-api.service';
import { BehaviorSubject, combineLatest } from 'rxjs';

@Component({
    selector: 'app-add-blinds',
    templateUrl: './add-blinds.component.html',
    styleUrls: ['./add-blinds.component.scss']
})
export class AddBlindsComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: { blindId: number[] | undefined, tournamentId: number };
    fields: FormlyFieldConfig[];

    private dialogRef: MatDialogRef<AddBlindsComponent> = inject(MatDialogRef<AddBlindsComponent>);
    data: { tournament: Tournament } = inject(MAT_DIALOG_DATA);

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private blindApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);

    allBlinds: { label: string, value: number }[];
    filterDuration: number;
    private filterDurationTrigger$ = new BehaviorSubject<number>(0);

    ngOnInit(): void {
        const allBlinds$ = this.blindApiService.getAll$().pipe(
            shareReplay(1)
        );

        combineLatest([
            allBlinds$,
            this.filterDurationTrigger$
        ]).pipe(
            tap(([blinds, duration]: [BlindLevel[], number]) => {
                this.allBlinds = blinds
                    .filter(
                        blind => !this.data.tournament.structure.filter(p => !p.isPause).map(p => p.id).includes(blind.id)
                    )
                    .filter(
                        (level) => {
                            if (duration === 0) {
                                return level;
                            }

                            return level.duration === +duration;
                        }
                    )
                    .map(
                        b => ({
                            label: this.getLabel(b),
                            value: b.id ?? 0
                        })
                    );

                this.initModel();
                this.initFields();
            })
        ).subscribe();
    }

    private getLabel(blind: BlindLevel): string {
        if (!blind.isPause) {
            return `${blind.sb} / ${blind.bb} / ${blind.ante} / ${blind.btnAnte} - ${blind.duration}min`;
        }

        return `PAUSE -${blind.isChipUp ? ' CHIP-UP -' : ''} ${blind.duration}min`;
    }

    private initModel(): void {
        this.model = {
            blindId: undefined,
            tournamentId: this.data.tournament.id ?? 0
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultMultiSelectField('blindId', 'Blind Level', true, this.allBlinds)
        ];
    }

    onFilterDurationChange(event: number): void {
        this.filterDurationTrigger$.next(event);
    }

    onSubmit(model: { blindId: number[] | undefined, tournamentId: number }): void {
        if (model.blindId && model.tournamentId) {
            this.tournamentApiService.addBlinds$(model.blindId, model.tournamentId, this.data.tournament.structure.length).pipe(
                tap((result: any) => {
                    if (this.dialogRef) {
                        this.dialogRef.close({
                            blindId: model.blindId
                        });
                    }
                })
            ).subscribe();
        }
    }

}
