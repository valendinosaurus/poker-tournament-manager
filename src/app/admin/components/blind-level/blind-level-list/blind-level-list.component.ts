import { Component, inject, OnInit } from '@angular/core';
import { BlindLevelApiService } from '../../../../core/services/api/blind-level-api.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { BlindLevel } from '../../../../shared/models/blind-level.interface';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { TriggerService } from '../../../../core/services/util/trigger.service';

@Component({
    selector: 'app-blind-level-list',
    templateUrl: './blind-level-list.component.html',
    styleUrls: ['./blind-level-list.component.scss']
})
export class BlindLevelListComponent implements OnInit {

    blindLevels$: Observable<BlindLevel[]>;
    blinds$: Observable<BlindLevel[]>;
    pauses$: Observable<BlindLevel[]>;

    filterDuration: number;

    private blindLevelApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private triggerService: TriggerService = inject(TriggerService);
    private filterDurationTrigger$ = new BehaviorSubject<number>(0);

    ngOnInit(): void {
        this.blindLevels$ = this.triggerService.getBlindsTrigger$().pipe(
            switchMap(() => this.blindLevelApiService.getAll$().pipe(
                map((levels: BlindLevel[]) => levels.sort((a, b) => {
                    if (a.sb !== b.sb) {
                        return a.sb - b.sb;
                    }

                    return a.bb - b.bb;
                }))
            )),
            shareReplay(1)
        );

        this.blinds$ = this.filterDurationTrigger$.pipe(
            switchMap((duration: number) => this.blindLevels$.pipe(
                map(levels => levels.filter(l => !l.isPause)),
                map((levels: BlindLevel[]) => levels.filter(
                    (level) => {
                        if (duration === 0) {
                            return level;
                        }

                        return level.duration === +duration;
                    }
                )),
            ))
        );

        this.pauses$ = this.blindLevels$.pipe(
            map(levels => levels.filter(l => l.isPause)),
            map(levels => levels.sort((a, b) => {
                if (a.duration - b.duration !== 0) {
                    return a.duration - b.duration;
                }

                return a.isChipUp === b.isChipUp ? 0 : a.isChipUp ? -1 : 1;
            }))
        );
    }

    onFilterDurationChange(event: number): void {
        this.filterDurationTrigger$.next(event);
    }

    deleteLevel(level: BlindLevel): void {
        this.blindLevelApiService.delete$(level.id ?? -1).pipe(
            tap(() => this.triggerService.triggerBlinds())
        ).subscribe();
    }

}
