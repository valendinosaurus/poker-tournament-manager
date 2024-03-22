import { Pipe, PipeTransform } from '@angular/core';
import { TEventType } from '../enums/t-event-type.enum';
import { TEvent } from '../models/t-event.interface';

@Pipe({
    name: 'tEventTypeIcon'
})
export class TEventTypeIconPipe implements PipeTransform {

    transform(value: TEvent): string {
        switch (value.type) {
            case TEventType.ADDON:
                return 'fa-database';
            case TEventType.REBUY:
                return 'fa-refresh';
            case TEventType.CORRECTION:
                return 'fa-eraser';
            case TEventType.DEAL:
                return 'fa-handshake';
            case TEventType.ELIMINATION:
                return 'fa-bolt';
            case TEventType.ENTRY:
                return 'fa-money-bill-wave';
            case TEventType.FINISH:
                return 'fa-skull';
        }

        return 'fa-skull';
    }

}
