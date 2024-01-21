import { Pipe, PipeTransform } from '@angular/core';
import { BlindLevel } from '../models/blind-level.interface';

@Pipe({
    name: 'blindLevelText'
})
export class BlindLevelTextPipe implements PipeTransform {

    transform(level: BlindLevel | undefined): string {
        if (!level?.isPause) {
            return `${Math.round((level as BlindLevel).sb)} / ${
                Math.round((level as BlindLevel).bb)
            }`;
        }

        let text = `<span>PAUSE (${level.duration}min)</span>`;

        if (level.isChipUp || level.endsRebuy) {
            text += '<span class="smaller">';
        }

        if (level.isChipUp) {
            text += 'CHIP UP';
        }

        if (level.isChipUp && level.endsRebuy) {
            text += ' | ';
        }

        if (level.endsRebuy) {
            text += 'ENDS RE-BUY';
        }

        if (level.isChipUp || level.endsRebuy) {
            text += '</span>';
        }

        return text;
    }

}
