import { Tournament } from './tournament.interface';

export enum BroadcastAction {
    UPDATE = 'UPDATE',
    START = 'START',
    PAUSE = 'PAUSE',
    NEXT_LEVEL = 'NEXT_LEVEL',
    PREV_LEVEL = 'PREV_LEVEL',
    ADD_MINUTE = 'ADD_MINUTE',
    HEARTBEAT = 'HEARTBEAT',
}

export interface BroadcastEvent {
    senderUuid: number;
    tournamentId: number;
    action: BroadcastAction;
    data: Tournament | null;
}
