import { EntryType } from '../enums/entry-type.enum';

export interface ConductedEntry {
    name: string;
    playerId: number;
    time: number;
    entryId: number;
    image: string;
    isFinished: boolean;
    type: EntryType;
    isBlocked?: boolean;
}
