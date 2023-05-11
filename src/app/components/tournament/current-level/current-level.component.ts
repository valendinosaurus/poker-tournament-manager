import {Component, Input, OnChanges} from '@angular/core';
import {BlindLevel} from 'src/app/shared/models/blind-level.interface';
import {Pause} from 'src/app/shared/models/pause.interface';

@Component({
    selector: 'app-current-level',
    templateUrl: './current-level.component.html',
    styleUrls: ['./current-level.component.scss'],
})
export class CurrentLevelComponent implements OnChanges {
    @Input() level: BlindLevel | Pause | null = null;

    text: string = '';

    ngOnChanges(): void {
        if (!!this.level?.hasOwnProperty('bb')) {
            this.text = `${(this.level as BlindLevel).sb} / ${
                (this.level as BlindLevel).bb
            }`;
        } else {
            this.text = 'PAUSE';

            if ((this.level as Pause).type === 'chip-up')
                this.text += ' - CHIP UP'
        }
    }
}
