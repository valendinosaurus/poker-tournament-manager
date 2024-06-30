import { Pipe, PipeTransform } from '@angular/core';
import { BlindLevel } from '../interfaces/blind-level.interface';

@Pipe({
    name: 'pauseTriggerText',
    standalone: true
})
export class PauseTriggerTextPipe implements PipeTransform {

    transform(blindIds: number[] | null | undefined, allBlinds: BlindLevel[]): string {
        if (!blindIds || blindIds.length === 0 || blindIds[0] === -1) {
            return '';
        }

        const blindLevel = allBlinds.find(bl => bl.id === blindIds[0]);

        if (!blindLevel) {
            return '';
        }

        let text = `Pause ${blindLevel.duration}min`;

        if (blindLevel.isChipUp) {
            text += ' (Chip Up)';
        }

        if (blindLevel.endsRebuy) {
            text += ' (Ends Rebuy)';
        }

        return text;
    }

}
