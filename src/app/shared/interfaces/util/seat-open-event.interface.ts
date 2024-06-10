import { Finish } from '../finish.interface';
import { Elimination } from '../elimination.interface';
import { TEvent } from '../t-event.interface';
import { Entry } from '../entry.interface';

export interface SeatOpenEvent {
    tournamentId: number;
    clientId: number;
    finishes: Finish[];
    elimination: Elimination;
    tEvents: TEvent[];
}

export interface DeleteSeatOpenEvent {
    tournamentId: number;
    clientId: number;
    eliminatedId: number;
    rank: number;
    price: number;
    eliminatorId: number;
    eId: string;
    messageFinish: string;
    messageElimination: string;
}

export interface RebuyEvent {
    tournamentId: number;
    clientId: number;
    entry: Entry;
    elimination: Elimination;
    tEvent: TEvent;
}

export interface DeleteRebuyAddonEvent {
    entryId: number;
    tEvent: TEvent;
}

export interface AddonEvent {
    tournamentId: number;
    clientId: number;
    entry: Entry;
    tEvent: TEvent;
}
