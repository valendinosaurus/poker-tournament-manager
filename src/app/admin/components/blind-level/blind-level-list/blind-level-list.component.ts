import { Component, inject, OnInit } from '@angular/core';
import { BlindLevelApiService } from '../../../../core/services/api/blind-level-api.service';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { BlindLevel } from '../../../../shared/models/blind-level.interface';
import { filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { TriggerService } from '../../../../core/services/util/trigger.service';
import { AuthService, User } from '@auth0/auth0-angular';

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
    private authService: AuthService = inject(AuthService);

    ngOnInit(): void {
        this.blindLevels$ = combineLatest([
            this.triggerService.getBlindsTrigger$(),
            this.authService.user$
        ]).pipe(
            map(([_trigger, user]: [void, User | undefined | null]) => user?.sub ?? ''),
            filter((sub: string) => sub.length > 0),
            switchMap((sub: string) => this.blindLevelApiService.getAll$(sub).pipe(
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
        this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.blindLevelApiService.delete$(level.id, sub).pipe(
                take(1),
                tap(() => this.triggerService.triggerBlinds())
            ))
        ).subscribe();
    }

}
