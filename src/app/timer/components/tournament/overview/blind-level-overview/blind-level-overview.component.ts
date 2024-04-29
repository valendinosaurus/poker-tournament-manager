import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { BlindLevel } from '../../../../../shared/models/blind-level.interface';
import { BlindLevelTextPipe } from '../../../../../shared/pipes/blind-level-text.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

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
export class BlindLevelOverviewComponent implements OnChanges {

    @Input() levels: BlindLevel[];
    @Input() currentLevelIndex: number;
    @Input() isSimpleTournament: boolean;
    @Input() showCondensed: boolean | null;
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
            //.slice(this.currentLevelIndex - 3, this.currentLevelIndex + 3);
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
