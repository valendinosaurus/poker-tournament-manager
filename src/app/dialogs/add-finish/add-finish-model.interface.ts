export interface AddFinishModel {
    playerId: number | undefined;
    tournamentId: number;
    eliminatedBy: number | undefined;
    showEliminatedBy: boolean;
}
