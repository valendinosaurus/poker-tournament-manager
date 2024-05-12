import { Component, computed, inject, OnInit, Signal } from '@angular/core';
import { Entry } from '../../../../../shared/models/entry.interface';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';
import { DecimalPipe } from '@angular/common';
import { TimerStateService } from '../../../../services/timer-state.service';

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

    private state: TimerStateService = inject(TimerStateService);

    ngOnInit(): void {
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
