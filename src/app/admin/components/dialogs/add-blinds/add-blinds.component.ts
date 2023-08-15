import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { BlindLevelApiService } from '../../../../core/services/api/blind-level-api.service';
import { BlindLevel } from '../../../../shared/models/blind-level.interface';
import { TournamentApiService } from '../../../../core/services/api/tournament-api.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, User } from '@auth0/auth0-angular';

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
    private destroyRef: DestroyRef = inject(DestroyRef);
    private authService: AuthService = inject(AuthService);

    allBlinds: { label: string, value: number }[];
    filterDuration: number;
    private filterDurationTrigger$ = new BehaviorSubject<number>(0);

    ngOnInit(): void {
        const allBlinds$ = this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.blindApiService.getAll$(sub)),
            shareReplay(1)
        );

        combineLatest([
            allBlinds$,
            this.filterDurationTrigger$
        ]).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(([blinds, duration]: [BlindLevel[], number]) => {
                this.allBlinds = blinds
                    .filter(b => !b.isPause)
                    .filter(
                        blind => !this.data.tournament.structure.filter(p => !p.isPause).map(p => p.id).includes(blind.id)
                    )
                    .filter(blind => blind.sb > Math.max(...this.data.tournament.structure.map(b => b.sb)))
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
            blindId: undefined,
            tournamentId: this.data.tournament.id
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultMultiSelectField('blindId', 'Blind Level', true, this.allBlinds)
        ];
    }

    onFilterDurationChange(event: number): void {
        this.filterDurationTrigger$.next(+event);
    }

    onSubmit(model: { blindId: number[] | undefined, tournamentId: number }): void {
        if (model.blindId && model.tournamentId) {

            const positions = [];
            const startIndex = this.data.tournament.structure.length * 2;
            const numberOfBlindsToAdd = model.blindId.length;
            const endIndex = startIndex + (numberOfBlindsToAdd * 2);

            for (let i = startIndex; i < endIndex; i += 2) {
                positions.push(i);
            }

            this.tournamentApiService.addBlinds$(model.blindId, model.tournamentId, positions).pipe(
                take(1),
                tap(() => {
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
