export interface ConductedEntry {
    name: string;
    playerId: number;
    time: number;
    entryId: number;
    image: string;
    isFinished: boolean;
    type: 'ENTRY' | 'REBUY' | 'ADDON' | 'RE-ENTRY';
    isBlocked?: boolean;
}
