import { Component, computed, inject, OnInit, Signal, WritableSignal } from '@angular/core';
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

    tournament: WritableSignal<Tournament>;
    textRebuys: Signal<string>;
    textAddons: Signal<string>;
    isWithRebuy = computed(() => this.tournament().withRebuy);
    isWithAddon = computed(() => this.tournament().withAddon);

    private state: TimerStateService = inject(TimerStateService);

    ngOnInit(): void {
        this.tournament = this.state.tournament;

        const rebuys = computed(() => this.tournament().entries.filter((e: Entry) => e.type === EntryType.REBUY).length);
        const addons = computed(() => this.tournament().entries.filter((e: Entry) => e.type === EntryType.ADDON).length);

        this.textRebuys = computed(() => `${rebuys()}`);
        this.textAddons = computed(() => `${addons()}`);
    }
}
