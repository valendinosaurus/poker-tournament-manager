import { Component, computed, inject, OnInit, Signal } from '@angular/core';
import { Entry } from '../../../../../shared/interfaces/entry.interface';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';
import { DecimalPipe } from '@angular/common';
import { TimerStateService } from '../../../../services/timer-state.service';
import { Tournament } from '../../../../../shared/interfaces/tournament.interface';

@Component({
    selector: 'app-buyin-overview',
    templateUrl: './buyin-overview.component.html',
    styles: [':host{display: contents}'],
    standalone: true,
    imports: [DecimalPipe],
})
export class BuyinOverviewComponent implements OnInit {

    tournament: Signal<Tournament>;
    textEntries: Signal<string>;
    textRebuys: Signal<string>;
    textAddons: Signal<string>;

    private state: TimerStateService = inject(TimerStateService);

    ngOnInit(): void {
        this.tournament = computed(() => this.state.tournament());
        const entries = computed(() =>
            this.tournament().entries.filter((e: Entry) => e.type === EntryType.ENTRY).length
        );

        const reEntries = computed(() => this.tournament().entries.filter((e: Entry) => e.type === EntryType.RE_ENTRY).length);
        const rebuys = computed(() => this.tournament().entries.filter((e: Entry) => e.type === EntryType.REBUY).length);
        const addons = computed(() => this.tournament().entries.filter((e: Entry) => e.type === EntryType.ADDON).length);

        this.textEntries = computed(() => `${entries() + reEntries()}`);
        this.textRebuys = computed(() => `${rebuys()}`);
        this.textAddons = computed(() => `${addons()}`);
    }
}
