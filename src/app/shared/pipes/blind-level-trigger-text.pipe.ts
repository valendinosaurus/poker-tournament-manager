import { Pipe, PipeTransform } from '@angular/core';
import { BlindLevel } from '../interfaces/blind-level.interface';

@Pipe({
    name: 'blindLevelTriggerText',
    standalone: true
})
export class BlindLevelTriggerTextPipe implements PipeTransform {

    transform(blindIds: number[] | null | undefined, allBlinds: BlindLevel[]): string {
        if (!blindIds || blindIds.length === 0 || blindIds[0] === -1) {
            return '';
        }

        const blindLevel = allBlinds.find(bl => bl.id === blindIds[0]);

        if (!blindLevel) {
            return '';
        }

        return `${blindLevel.sb} / ${blindLevel.bb} / ${blindLevel.ante} / ${blindLevel.btnAnte} / ${blindLevel.duration}min`;
    }

}
