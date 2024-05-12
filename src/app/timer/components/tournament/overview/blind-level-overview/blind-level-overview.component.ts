import {
    Component,
    computed,
    EventEmitter,
    inject,
    input,
    OnInit,
    Output,
    Signal,
    WritableSignal
} from '@angular/core';
import { BlindLevel } from '../../../../../shared/models/blind-level.interface';
import { BlindLevelTextPipe } from '../../../../../shared/pipes/blind-level-text.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TimerStateService } from '../../../../services/timer-state.service';

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
    ],
})
export class BlindLevelOverviewComponent implements OnInit {

    levels = input.required<BlindLevel[]>();

    @Output() addBlind = new EventEmitter<void>();

    isSimpleTournament: WritableSignal<boolean>;
    levelsToShow: Signal<BlindLevel[]>;
    currentLevelIndex: WritableSignal<number>;

    ii = 1;

    private state: TimerStateService = inject(TimerStateService);

    ngOnInit(): void {
        this.isSimpleTournament = this.state.isTournamentFinished;
        this.currentLevelIndex = this.state.currentLevelIndex;

        this.levelsToShow = computed(() =>
            this.levels().map(l => ({
                ...l,
                id: l.isPause ? this.ii : this.ii++
            }))
        );
    }

}
