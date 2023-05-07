import { Component, Input, OnChanges } from '@angular/core';
import { BlindLevel } from 'src/app/shared/models/blind-level.interface';
import { Pause } from 'src/app/shared/models/pause.interface';

@Component({
  selector: 'app-next-level',
  templateUrl: './next-level.component.html',
  styleUrls: ['./next-level.component.scss'],
})
export class NextLevelComponent implements OnChanges {
  @Input() level: BlindLevel | Pause | null = null;

  text: string = '';

  ngOnChanges(): void {
    if (!!this.level?.hasOwnProperty('bb')) {
      this.text = `${(this.level as BlindLevel).sb} / ${
        (this.level as BlindLevel).bb
      }`;
    } else {
      this.text = 'PAUSE';
    }
  }
}
