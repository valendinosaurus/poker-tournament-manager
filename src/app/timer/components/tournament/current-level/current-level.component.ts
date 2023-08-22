import { Component, Input, OnChanges } from '@angular/core';
import { BlindLevel } from 'src/app/shared/models/blind-level.interface';

@Component({
    selector: 'app-current-level',
    templateUrl: './current-level.component.html',
    styleUrls: ['./current-level.component.scss'],
})
export class CurrentLevelComponent implements OnChanges {
    @Input() level: BlindLevel | null = null;

    text: string = '';

    ngOnChanges(): void {
        if (!this.level?.isPause) {
            this.text = `${Math.round((this.level as BlindLevel).sb)} / ${
                Math.round((this.level as BlindLevel).bb)
            }`;
        } else {
            this.text = 'PAUSE';

            if (this.level.isChipUp)
                this.text += ' - CHIP UP';
        }
    }
}
