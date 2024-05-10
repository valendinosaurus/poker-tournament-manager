import { Component, computed, inject, OnInit, Signal } from '@angular/core';
import { TimerStateService } from '../../../../services/timer-state.service';

@Component({
    selector: 'app-player-overview',
    templateUrl: './player-overview.component.html',
    styles: [':host{display: contents}'],
    standalone: true,
})
export class PlayerOverviewComponent implements OnInit {

    text: Signal<string>;

    private timerStateService: TimerStateService = inject(TimerStateService);

    ngOnInit(): void {
        const tournament = computed(() => this.timerStateService.tournament());
        const playersIn = computed(() => tournament().players.length - tournament().finishes.length);
        this.text = computed(() => `${playersIn()}/${tournament().players.length}`);
    }

}
