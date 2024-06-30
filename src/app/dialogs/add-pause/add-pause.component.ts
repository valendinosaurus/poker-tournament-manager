import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BlindLevelApiService } from '../../shared/services/api/blind-level-api.service';
import { TournamentApiService } from '../../shared/services/api/tournament-api.service';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, shareReplay, take, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlindLevel } from '../../shared/interfaces/blind-level.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { BlindStructureApiService } from '../../shared/services/api/blind-structure-api.service';
import { BaseAddDialogComponent } from '../../shared/components/base-add-dialog/base-add-dialog.component';
import { AddPlayerComponent } from '../add-player/add-player.component';
import { AddPauseModel } from './add-pause-model.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { PauseTriggerTextPipe } from '../../shared/pipes/pause-trigger-text.pipe';
import { AddPauseSelectOptionComponent } from './add-pause-select-option/add-pause-select-option.component';

@Component({
    selector: 'app-add-pause',
    templateUrl: './add-pause.component.html',
    styleUrls: ['./add-pause.component.scss'],
    standalone: true,
    imports: [
        MatRadioModule,
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatOptionModule,
        MatSelectModule,
        PauseTriggerTextPipe,
        AddPauseSelectOptionComponent
    ]
})
export class AddPauseComponent extends BaseAddDialogComponent<AddPlayerComponent, AddPauseModel> implements OnInit {

    data: {
        tId: number | undefined,
        sId: number | undefined,
        position: number
    } = inject(MAT_DIALOG_DATA);

    private blindApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private blindStructureApiService: BlindStructureApiService = inject(BlindStructureApiService);
    private destroyRef: DestroyRef = inject(DestroyRef);

    allPauses: BlindLevel[] = [];
    filterDuration: number;
    private filterDurationTrigger$ = new BehaviorSubject<number>(0);

    ngOnInit(): void {
        this.initModel();

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
                    );
            })
        ).subscribe();
    }

    private initModel(): void {
        this.model = {
            blindId: signal(undefined),
            parentId: signal(this.data.tId ?? this.data.sId ?? -1),
            isValid: computed(() => this.model.blindId() !== undefined)
        };
    }

    onFilterDurationChange(event: number): void {
        this.filterDurationTrigger$.next(event);
    }

    onSubmit(): void {
        if (this.model.blindId() && this.model.parentId() && this.model.parentId() >= 0) {
            this.isLoadingAdd = true;

            if (this.data.tId) {
                this.tournamentApiService.addPause$(this.model.blindId()!, this.model.parentId(), this.data.position).pipe(
                    take(1),
                    tap(() => {
                        if (this.dialogRef) {
                            this.dialogRef.close(true);
                            this.isLoadingAdd = false;
                        }
                    }),
                    catchError(() => {
                        this.isLoadingAdd = false;
                        return of(null);
                    })
                ).subscribe();
            }

            if (this.data.sId) {
                this.blindStructureApiService.addPause$(this.model.blindId()!, this.model.parentId(), this.data.position).pipe(
                    take(1),
                    tap(() => {
                        if (this.dialogRef) {
                            this.dialogRef.close(true);
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

}
