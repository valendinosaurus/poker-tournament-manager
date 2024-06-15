import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormlyFieldService } from '../../shared/services/util/formly-field.service';
import { BlindLevelApiService } from '../../shared/services/api/blind-level-api.service';
import { TournamentApiService } from '../../shared/services/api/tournament-api.service';
import { AuthService } from '@auth0/auth0-angular';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { shareReplay, take, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlindLevel } from '../../shared/interfaces/blind-level.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { BlindStructureApiService } from '../../shared/services/api/blind-structure-api.service';

@Component({
    selector: 'app-add-pause',
    templateUrl: './add-pause.component.html',
    styleUrls: ['./add-pause.component.scss'],
    standalone: true,
    imports: [MatRadioModule, FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule]
})
export class AddPauseComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: {
        blindId: number | undefined,
        parentId: number
    };
    fields: FormlyFieldConfig[];

    private dialogRef: MatDialogRef<AddPauseComponent> = inject(MatDialogRef<AddPauseComponent>);
    data: {
        tId: number | undefined,
        sId: number | undefined,
        position: number
    } = inject(MAT_DIALOG_DATA);

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private blindApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private blindStructureApiService: BlindStructureApiService = inject(BlindStructureApiService);
    private destroyRef: DestroyRef = inject(DestroyRef);

    allPauses: { label: string, value: number }[];
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
            takeUntilDestroyed(this.destroyRef),
            tap(([blinds, duration]: [BlindLevel[], number]) => {
                this.allPauses = blinds
                    .filter(b => b.isPause)
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
                            value: b.id
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

        return `PAUSE -${blind.isChipUp ? ' CHIP-UP -' : ''}${blind.endsRebuy ? ' ENDS REBUY -' : ''} ${blind.duration}min`;
    }

    private initModel(): void {
        this.model = {
            blindId: undefined,
            parentId: this.data.tId ?? this.data.sId ?? -1
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultSelectField('blindId', 'Blind Level', true, this.allPauses)
        ];
    }

    onFilterDurationChange(event: number): void {
        this.filterDurationTrigger$.next(event);
    }

    onSubmit(model: { blindId: number | undefined, parentId: number }): void {
        if (model.blindId && model.parentId && model.parentId >= 0) {

            if (this.data.tId) {
                this.tournamentApiService.addPause$(model.blindId, model.parentId, this.data.position).pipe(
                    take(1),
                    tap(() => {
                        if (this.dialogRef) {
                            this.dialogRef.close(true);
                        }
                    })
                ).subscribe();
            }

            if (this.data.sId) {
                this.blindStructureApiService.addPause$(model.blindId, model.parentId, this.data.position).pipe(
                    take(1),
                    tap(() => {
                        if (this.dialogRef) {
                            this.dialogRef.close(true);
                        }
                    })
                ).subscribe();
            }
        }
    }

    closeDialog(event: Event): void {
        event.preventDefault();

        this.dialogRef.close(false);
    }

}
