import { inject, Pipe, PipeTransform } from '@angular/core';
import { BlindLevel } from '../interfaces/blind-level.interface';
import { TimerStateService } from '../../timer/services/timer-state.service';

@Pipe({
    name: 'blindLevelText',
    pure: false,
    standalone: true
})
export class BlindLevelTextPipe implements PipeTransform {

    private state: TimerStateService = inject(TimerStateService);

    transform(level: BlindLevel | undefined, isCurrent: boolean): string {
        if (!level) {
            return '';
        }

        if (!level?.isPause) {
            if (this.state.showCondensedBlinds()) {
                const sb = (level as BlindLevel).sb;
                const bb = (level as BlindLevel).bb;

                const sbString = (sb >= 9999 || bb >= 9999) ? `${(sb / 1000)}k` : Math.round(sb);
                const bbString = (sb >= 9999 || bb >= 9999) ? `${(bb / 1000)}k` : Math.round(bb);

                return `${sbString} / ${bbString}`;
            }

            return `${Math.round((level as BlindLevel).sb)} / ${
                Math.round((level as BlindLevel).bb)
            }`;
        }

        let text = `<span>PAUSE`;

        if (!isCurrent) {
            text += ` (${level.duration}min)`;
        }

        text += `</span>`;

        if (level.isChipUp || level.endsRebuy) {
            text += '<span class="smaller">';
        }

        if (level.isChipUp) {
            text += ' CHIP UP';
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
