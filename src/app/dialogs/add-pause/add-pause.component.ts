import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormlyFieldService } from '../../core/services/util/formly-field.service';
import { BlindLevelApiService } from '../../core/services/api/blind-level-api.service';
import { TournamentApiService } from '../../core/services/api/tournament-api.service';
import { AuthService, User } from '@auth0/auth0-angular';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlindLevel } from '../../shared/models/blind-level.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';

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
    model: { blindId: number | undefined, tournamentId: number };
    fields: FormlyFieldConfig[];

    private dialogRef: MatDialogRef<AddPauseComponent> = inject(MatDialogRef<AddPauseComponent>);
    data: { tId: number, position: number } = inject(MAT_DIALOG_DATA);

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private blindApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private authService: AuthService = inject(AuthService);

    allPauses: { label: string, value: number }[];
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
            tournamentId: this.data.tId
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

    onSubmit(model: { blindId: number | undefined, tournamentId: number }): void {
        if (model.blindId && model.tournamentId) {

            this.tournamentApiService.addPause$(model.blindId, model.tournamentId, this.data.position).pipe(
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
