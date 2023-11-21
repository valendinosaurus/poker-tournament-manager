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

        let text = 'PAUSE';

        if (level.isChipUp) {
            text += ' - CHIP UP';
        }

        return text;
    }

}
