import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { BlindLevel } from '../../../../../shared/models/blind-level.interface';

@Component({
    selector: 'app-blind-level-overview',
    templateUrl: './blind-level-overview.component.html',
    styleUrls: ['./blind-level-overview.component.scss']
})
export class BlindLevelOverviewComponent implements OnChanges {

    @Input() levels: BlindLevel[];
    @Input() currentLevelIndex: number;
    @Input() isSimpleTournament: boolean;
    @Input() trigger: string | null;

    @Output() addBlind = new EventEmitter<void>();

    levelsToShow: BlindLevel[];
    scrollDown = true;

    ii = 1;

    ngOnChanges(changes: SimpleChanges): void {
        if (this.levels) {
            this.levelsToShow = this.levels.map(l => ({
                ...l,
                id: l.isPause ? this.ii : this.ii++
            }));
        }

        if (changes['trigger']?.currentValue === 'SCROLL') {
            if (this.scrollDown) {
                document.getElementById('bottom')?.scrollIntoView({behavior: 'smooth'});
            } else {
                document.getElementById('top')?.scrollIntoView({behavior: 'smooth'});
            }

            this.scrollDown = !this.scrollDown;
        }
    }

}
