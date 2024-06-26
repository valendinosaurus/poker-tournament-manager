import { Component, computed, DestroyRef, inject, OnInit, signal, Signal } from '@angular/core';
import { Entry } from '../../../../../shared/interfaces/entry.interface';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';
import { DecimalPipe } from '@angular/common';
import { TimerStateService } from '../../../../services/timer-state.service';
import { fromEvent } from 'rxjs';
import { debounceTime, map, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-chips-overview',
    templateUrl: './chips-overview.component.html',
    styles: [':host{display: contents}'],
    standalone: true,
    imports: [DecimalPipe],
})
export class ChipsOverviewComponent implements OnInit {

    totalChips: Signal<number>;
    averageStack: Signal<number>;
    isWithRebuyOrAddon = computed(() => this.state.tournament().withRebuy || this.state.tournament().withAddon);

    innerWidth = signal(window.innerWidth);
    innerHeight = signal(window.innerHeight);
    ratio = computed(() => this.innerHeight() / this.innerWidth());
    isTooNarrow = computed(() => this.ratio() < 0.5);

    private state: TimerStateService = inject(TimerStateService);
    private destroyRef: DestroyRef = inject(DestroyRef);

    ngOnInit(): void {
        fromEvent(window, 'resize').pipe(
            takeUntilDestroyed(this.destroyRef),
            map((i: any) => i),
            debounceTime(200),
            tap(() => {
                this.innerWidth.set(window.innerWidth);
                this.innerHeight.set(window.innerHeight);
            })
        ).subscribe();

        const tournament = computed(() => this.state.tournament());

        const entries = computed(() => tournament().entries.filter((e: Entry) => e.type === EntryType.ENTRY).length);
        const rebuys = computed(() => tournament().entries.filter((e: Entry) => e.type === EntryType.REBUY).length);
        const addons = computed(() => tournament().entries.filter((e: Entry) => e.type === EntryType.ADDON).length);
        const players = computed(() => tournament().players);
        const finishes = computed(() => tournament().finishes);

        const reEntries = computed(() => tournament().entries.filter((e: Entry) => e.type === EntryType.RE_ENTRY).length);
        const startStack = computed(() => tournament().startStack);
        const rebuyStack = computed(() => tournament().rebuyStack);
        const addonStack = computed(() => tournament().addonStack);

        this.totalChips = computed(() =>
            entries() * startStack()
            + reEntries() * startStack()
            + rebuys() * rebuyStack()
            + addons() * addonStack()
        );

        const playersIn = computed(() => players().length - finishes().length);

        this.averageStack = computed(() => {
            if (finishes().length === players().length) {
                return this.totalChips();
            } else {
                return Math.floor(this.totalChips() / playersIn());
            }
        });

    }
}
