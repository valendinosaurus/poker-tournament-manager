import { WritableSignal } from '@angular/core';

export interface AddFinishModel {
    playerId: number | undefined;
    tournamentId: number;
    eliminatedBy: number | undefined;
}

export interface AddFinishModelS {
    playerId: WritableSignal<number | undefined>;
    eliminatedBy: WritableSignal<number | undefined>;
    tournamentId: WritableSignal<number>;
}
