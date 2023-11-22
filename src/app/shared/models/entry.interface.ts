import { EntryType } from '../enums/entry-type.enum';

export interface Entry {
    id: number | undefined;
    tournamentId: number;
    playerId: number;
    type: EntryType;
    timestamp: number;
}
