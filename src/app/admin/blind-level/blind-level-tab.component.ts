import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { BlindLevel } from '../../shared/models/blind-level.interface';
import { AuthUtilService } from '../../core/services/auth-util.service';
import { MatDialog } from '@angular/material/dialog';
import { BlindLevelApiService } from '../../core/services/api/blind-level-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { DEFAULT_DIALOG_POSITION } from '../../core/const/app.const';
import { CreateBlindLevelComponent } from './create-blind-level/create-blind-level.component';
import { AsyncPipe, DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { RouterLink } from '@angular/router';
import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { CreatePauseComponent } from './create-pause/create-pause.component';
import { BlindLevelTableSortConfig } from '../../shared/models/util/table-sort-config.interface';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-blind-level-tab',
    templateUrl: './blind-level-tab.component.html',
    styleUrls: ['./blind-level-tab.component.scss'],
    standalone: true,
    imports: [
        AsyncPipe,
        MatButtonModule,
        NgForOf,
        NgIf,
        UserImageRoundComponent,
        RouterLink,
        DecimalPipe,
        MatRadioModule,
        FormsModule
    ]
})
export class BlindLevelTabComponent implements OnInit {

    blindLevels$: Observable<BlindLevel[]>;
    sortedAndFilteredBlindLevels$: Observable<BlindLevel[]>;
    durations$: Observable<number[]>;

    private blindLevelApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private dialog: MatDialog = inject(MatDialog);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private trigger$: ReplaySubject<void>;
    private sortTrigger$ = new BehaviorSubject<BlindLevelTableSortConfig>({
        property: 'sb',
        direction: 'ASC',
        filterType: 'ALL',
        duration: -1
    });

    type: 'ALL' | 'REGULAR' | 'PAUSE' = 'ALL';

    ngOnInit(): void {
        this.trigger$ = new ReplaySubject<void>();

        this.blindLevels$ = this.trigger$.pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() => this.blindLevelApiService.getAll$()),
            shareReplay(1)
        );

        this.sortedAndFilteredBlindLevels$ = combineLatest([
            this.blindLevels$,
            this.sortTrigger$
        ]).pipe(
            map(([levels, trigger]: [BlindLevel[], BlindLevelTableSortConfig]) =>
                levels.sort((a: BlindLevel, b: BlindLevel) => {
                    const base = trigger.direction === 'ASC' ? 1 : -1;

                    return (a as any)[trigger.property] > (b as any)[trigger.property] ? base : (base * -1);
                }).filter(
                    (blindLevel: BlindLevel) => {
                        if (trigger.filterType === 'REGULAR') {
                            return !blindLevel.isPause;
                        }

                        if (trigger.filterType === 'PAUSE') {
                            return blindLevel.isPause;
                        }

                        return true;
                    }
                ).filter(
                    (blindLevel: BlindLevel) => {
                        if (trigger.duration > -1) {
                            return blindLevel.duration === trigger.duration;
                        }

                        return true;
                    }
                )
            )
        );

        this.durations$ = this.blindLevels$.pipe(
            map((levels: BlindLevel[]) => levels.map((level: BlindLevel) => level.duration)),
            map((durations: number[]) => [...new Set(durations)])
        );

        this.trigger$.next();
    }

    sortBy(property: string): void {
        const current = this.sortTrigger$.value;

        this.sortTrigger$.next({
            ...current,
            property,
            direction: current.direction === 'ASC' ? 'DESC' : 'ASC'
        });
    }

    filterType(type: 'ALL' | 'REGULAR' | 'PAUSE'): void {
        const current = this.sortTrigger$.value;

        this.sortTrigger$.next({
            ...current,
            filterType: type
        });
    }

    filterDuration(duration: number): void {
        const current = this.sortTrigger$.value;

        this.sortTrigger$.next({
            ...current,
            duration
        });
    }

    createBlindLevel(): void {
        const ref = this.dialog.open(CreateBlindLevelComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh'
        });

        ref.afterClosed().pipe(
            take(1),
            tap((e) => {
                if (e) {
                    this.trigger$.next();
                }
            })
        ).subscribe();
    }

    createPause(): void {
        const ref = this.dialog.open(CreatePauseComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh'
        });

        ref.afterClosed().pipe(
            take(1),
            tap((e) => {
                if (e) {
                    this.trigger$.next();
                }
            })
        ).subscribe();
    }

    deleteBlindLevel(blindLevel: BlindLevel, event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Delete Blind Level?',
                    body: `Do you really want to delete blind level <strong>${blindLevel.sb} / ${blindLevel.bb} (${blindLevel.duration} min)</strong>`,
                    confirm: 'Delete Blind Level',
                    isDelete: true
                }
            });

        dialogRef.afterClosed().pipe(
            take(1),
            switchMap((confirmed) => iif(
                () => confirmed,
                defer(() => this.authUtilService.getSub$().pipe(
                    switchMap((sub: string) => this.blindLevelApiService.delete$(blindLevel.id, sub).pipe(
                        take(1),
                        tap(() => this.trigger$.next())
                    ))
                )),
                of(null)
            ))
        ).subscribe();
    }

}
