import { TEventType } from '../enums/t-event-type.enum';

export interface TEvent {
    id?: number;
    tId: number,
    message: string,
    type: TEventType,
    timestamp: number
}
