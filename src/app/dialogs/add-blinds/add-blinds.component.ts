import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Tournament } from '../../shared/interfaces/tournament.interface';
import { catchError, shareReplay, take, tap } from 'rxjs/operators';
import { BlindLevelApiService } from '../../shared/services/api/blind-level-api.service';
import { BlindLevel } from '../../shared/interfaces/blind-level.interface';
import { TournamentApiService } from '../../shared/services/api/tournament-api.service';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FetchService } from '../../shared/services/fetch.service';
import { BlindLevelTextPipe } from '../../shared/pipes/blind-level-text.pipe';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { BlindStructure } from '../../shared/interfaces/blind-structure.interface';
import { BlindStructureApiService } from '../../shared/services/api/blind-structure-api.service';
import { BaseAddDialogComponent } from '../../shared/components/base-add-dialog/base-add-dialog.component';
import { AddAddonComponent } from '../add-addon/add-addon.component';
import { AddBlindsModel } from './add-blinds-model.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { BlindLevelTriggerTextPipe } from '../../shared/pipes/blind-level-trigger-text.pipe';
import { AddBlindsSelectOptionComponent } from './add-blinds-select-option/add-blinds-select-option.component';

@Component({
    selector: 'app-add-blinds',
    templateUrl: './add-blinds.component.html',
    standalone: true,
    imports: [
        MatRadioModule,
        FormsModule,
        MatButtonModule,
        BlindLevelTextPipe,
        AsyncPipe,
        MatFormFieldModule,
        MatOptionModule,
        MatSelectModule,
        BlindLevelTriggerTextPipe,
        AddBlindsSelectOptionComponent
    ]
})
export class AddBlindsComponent extends BaseAddDialogComponent<AddAddonComponent, AddBlindsModel> implements OnInit {

    data: {
        tournament: Tournament | undefined,
        structure: BlindStructure | undefined
    } = inject(MAT_DIALOG_DATA);

    private blindApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private blindStructureApiService: BlindStructureApiService = inject(BlindStructureApiService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private fetchService: FetchService = inject(FetchService);

    allBlindLevels: BlindLevel[] = [];
    filterDuration: number;
    private filterDurationTrigger$ = new BehaviorSubject<number>(0);

    durations: number[];

    ngOnInit(): void {
        this.initModel();

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
                this.allBlindLevels = blinds
                    .filter(b => !b.isPause)
                    .sort((a, b) => a.bb - b.bb)
                    .filter(blind => !base.filter(p => !p.isPause).map(p => p.id).includes(blind.id))
                    .filter(
                        (level) => {
                            if (+duration === 0) {
                                return level;
                            }

                            return +level.duration === +duration;
                        }
                    );

                this.durations = Array.from(new Set(blinds.map(b => b.duration)));
            })
        ).subscribe();

    }

    private initModel(): void {
        this.model = {
            blindIds: signal(undefined),
            parentId: signal(this.data.tournament?.id ?? this.data.structure?.id ?? -1),
            isValid: computed(() =>
                this.model.blindIds() !== undefined &&
                this.model.blindIds()!.length > 0 &&
                this.model.parentId() >= 0
            )
        };
    }

    onFilterDurationChange(event: number): void {
        this.filterDurationTrigger$.next(+event);
    }

    onSubmit(): void {
        this.isLoadingAdd = true;

        const model = {
            blindIds: this.model.blindIds(),
            parentId: this.model.parentId()
        };

        if (model.blindIds && model.parentId && model.parentId >= 0) {
            const base = this.data.tournament?.structure ?? this.data.structure?.structure ?? [];
            const positions = [];
            const startIndex = base.length * 2;
            const numberOfBlindsToAdd = model.blindIds.length;
            const endIndex = startIndex + (numberOfBlindsToAdd * 2);

            for (let i = startIndex; i < endIndex; i += 2) {
                positions.push(i);
            }

            const action$ = this.data.tournament
                ? this.tournamentApiService.addBlinds$(model.blindIds, model.parentId, positions)
                : this.blindStructureApiService.addBlinds$(model.blindIds, model.parentId, positions);

            action$.pipe(
                take(1),
                tap((a) => this.fetchService.trigger()),
                tap(() => {
                    if (this.dialogRef) {
                        this.dialogRef.close({
                            blindId: model.blindIds
                        });
                    }

                    this.isLoadingAdd = false;
                }),
                catchError(() => {
                    this.isLoadingAdd = false;
                    return of(null);
                })
            ).subscribe();
        }
    }

}
