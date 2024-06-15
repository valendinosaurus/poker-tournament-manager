import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../shared/interfaces/tournament.interface';
import { FormlyFieldService } from '../../shared/services/util/formly-field.service';
import { shareReplay, take, tap } from 'rxjs/operators';
import { BlindLevelApiService } from '../../shared/services/api/blind-level-api.service';
import { BlindLevel } from '../../shared/interfaces/blind-level.interface';
import { TournamentApiService } from '../../shared/services/api/tournament-api.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FetchService } from '../../shared/services/fetch.service';
import { BlindLevelTextPipe } from '../../shared/pipes/blind-level-text.pipe';
import { NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { BlindStructure } from '../../shared/interfaces/blind-structure.interface';
import { BlindStructureApiService } from '../../shared/services/api/blind-structure-api.service';

@Component({
    selector: 'app-add-blinds',
    templateUrl: './add-blinds.component.html',
    styleUrls: ['./add-blinds.component.scss'],
    standalone: true,
    imports: [MatRadioModule, FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgIf, NgFor, BlindLevelTextPipe]
})
export class AddBlindsComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: {
        blindIds: number[] | undefined,
        parentId: number
    };
    fields: FormlyFieldConfig[];

    private dialogRef: MatDialogRef<AddBlindsComponent> = inject(MatDialogRef<AddBlindsComponent>);
    data: {
        tournament: Tournament | undefined,
        structure: BlindStructure | undefined
    } = inject(MAT_DIALOG_DATA);

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private blindApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private blindStructureApiService: BlindStructureApiService = inject(BlindStructureApiService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private fetchService: FetchService = inject(FetchService);

    allBlinds: { label: string, value: number }[];
    filterDuration: number;
    private filterDurationTrigger$ = new BehaviorSubject<number>(0);

    ngOnInit(): void {
        const allBlinds$ = this.blindApiService.getAll$().pipe(
            shareReplay(1)
        );

        const base = this.data.tournament?.structure ?? this.data.structure?.structure ?? [];

        combineLatest([
            allBlinds$,
            this.filterDurationTrigger$
        ]).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(([blinds, duration]: [BlindLevel[], number]) => {
                this.allBlinds = blinds
                    .filter(b => !b.isPause)
                    .sort((a, b) => a.bb - b.bb)
                    .filter(blind => !base.filter(p => !p.isPause).map(p => p.id).includes(blind.id))
                    //   .filter(blind => blind.sb > Math.max(...base.map(b => b.sb)))
                    .filter(
                        (level) => {
                            if (+duration === 0) {
                                return level;
                            }

                            return +level.duration === +duration;
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

        return `PAUSE -${blind.isChipUp ? ' CHIP-UP -' : ''} ${blind.duration}min`;
    }

    private initModel(): void {
        this.model = {
            blindIds: undefined,
            parentId: this.data.tournament?.id ?? this.data.structure?.id ?? -1
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultMultiSelectField('blindIds', 'Blind Level', true, this.allBlinds)
        ];
    }

    onFilterDurationChange(event: number): void {
        this.filterDurationTrigger$.next(+event);
    }

    onSubmit(model: { blindIds: number[] | undefined, parentId: number }): void {
        if (model.blindIds && model.parentId && model.parentId >= 0) {
            const base = this.data.tournament?.structure ?? this.data.structure?.structure ?? [];
            const positions = [];
            const startIndex = base.length * 2;
            const numberOfBlindsToAdd = model.blindIds.length;
            const endIndex = startIndex + (numberOfBlindsToAdd * 2);

            for (let i = startIndex; i < endIndex; i += 2) {
                positions.push(i);
            }

            if (this.data.tournament) {
                this.tournamentApiService.addBlinds$(model.blindIds, model.parentId, positions).pipe(
                    take(1),
                    tap((a) => this.fetchService.trigger()),
                    tap(() => {
                        if (this.dialogRef) {
                            this.dialogRef.close({
                                blindId: model.blindIds
                            });
                        }
                    })
                ).subscribe();
            }

            if (this.data.structure) {
                this.blindStructureApiService.addBlinds$(model.blindIds, model.parentId, positions).pipe(
                    take(1),
                    tap((a) => this.fetchService.trigger()),
                    tap(() => {
                        if (this.dialogRef) {
                            this.dialogRef.close({
                                blindId: model.blindIds
                            });
                        }
                    })
                ).subscribe();
            }
        }
    }

    removeBlind(blindId: number): void {
        // TODO
    }

}
