import { Signal, WritableSignal } from '@angular/core';

export interface AddTournamentModel {
    seriesId: WritableSignal<number>;
    tournamentId: WritableSignal<number | undefined>;
    isValid: Signal<boolean>;
}
