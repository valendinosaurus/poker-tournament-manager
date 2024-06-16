import { Component, computed, inject, OnInit, Signal, WritableSignal } from '@angular/core';
import { TimerStateService } from '../../../../services/timer-state.service';
import { DecimalPipe } from '@angular/common';
import { Entry } from '../../../../../shared/interfaces/entry.interface';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';
import { Tournament } from '../../../../../shared/interfaces/tournament.interface';

@Component({
    selector: 'app-player-overview',
    templateUrl: './player-overview.component.html',
    styles: [':host{display: contents}'],
    standalone: true,
    imports: [
        DecimalPipe
    ]
})
export class PlayerOverviewComponent implements OnInit {

    tournament: WritableSignal<Tournament>;
    text: Signal<string>;
    textEntries: Signal<string>;

    private state: TimerStateService = inject(TimerStateService);

    ngOnInit(): void {
        this.tournament = this.state.tournament;
        const playersIn = computed(() => this.tournament().players.length - this.tournament().finishes.length);
        this.text = computed(() => `${playersIn()}/${this.tournament().players.length}`);

        const entries = computed(() =>
            this.tournament().entries.filter((e: Entry) => e.type === EntryType.ENTRY).length
        );
        const reEntries = computed(() => this.tournament().entries.filter((e: Entry) => e.type === EntryType.RE_ENTRY).length);

        this.textEntries = computed(() => `${entries() + reEntries()}`);
    }

}
