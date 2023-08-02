export interface Entry {
    id: number | undefined;
    tournamentId: number;
    playerId: number;
    type: 'ENTRY' | 'REBUY' | 'ADDON' | 'RE-ENTRY'; // TODO REENTRY
}
