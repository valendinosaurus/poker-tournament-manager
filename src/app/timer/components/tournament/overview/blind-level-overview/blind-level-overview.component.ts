import {
    Component,
    computed,
    effect,
    EventEmitter,
    inject,
    input,
    OnInit,
    Output,
    Signal,
    WritableSignal
} from '@angular/core';
import { BlindLevel } from '../../../../../shared/interfaces/blind-level.interface';
import { BlindLevelTextPipe } from '../../../../../shared/pipes/blind-level-text.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TimerStateService } from '../../../../services/timer-state.service';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-blind-level-overview',
    templateUrl: './blind-level-overview.component.html',
    styles: [':host{display: contents}'],
    standalone: true,
    imports: [
        NgIf,
        MatTooltipModule,
        NgFor,
        DecimalPipe,
        BlindLevelTextPipe,
        MatButtonModule,
        RouterLink,
    ],
})
export class BlindLevelOverviewComponent implements OnInit {

    // TODO remove inputs
    levels = input.required<BlindLevel[]>();
    fill = input<boolean>(false);

    tournamentId = computed(() => this.state.tournament().id);
    isProOrAdmin: Signal<boolean>;
    levelsToShow: Signal<BlindLevel[]>;
    currentLevelIndex: WritableSignal<number>;
    forceStopSlide: WritableSignal<boolean>;

    ii = 1;

    private state: TimerStateService = inject(TimerStateService);

    _effect = effect(() => this.state.forceStopSlide.set(this.levels().length === 0));

    @Output() addBlind = new EventEmitter<void>();

    ngOnInit(): void {
        this.isProOrAdmin = this.state.isProOrAdmin;
        this.currentLevelIndex = this.state.currentLevelIndex;
        this.forceStopSlide = this.state.forceStopSlide;

        this.levelsToShow = computed(() =>
            this.levels().map(l => ({
                ...l,
                id: l.isPause ? this.ii : this.ii++
            }))
        );
    }

}
